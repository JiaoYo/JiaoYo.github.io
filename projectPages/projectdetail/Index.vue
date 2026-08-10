<script lang="ts" setup>
import { v4 as uuidv4 } from "uuid";
import { throttle } from "@/utils/debounce";
import { useMessage } from 'wot-design-uni';
import { uploadFile } from '@/utils/uploadFile';
import { copyText } from '@/utils/copyText';
import { useLargeArrayStore } from '@/store/useDataStore';
import { onReady, onLoad, onUnload, onPullDownRefresh, onReachBottom, onPageScroll } from '@dcloudio/uni-app';
import { reactive, ref, nextTick, computed, watch } from 'vue';
import { useTheme } from '@/composables/theme/theme';
import { getExtensionFromUrl, downloadFile, isImageUrl, hasPermission, getFileType, isSupportedFileType } from '@/utils/index';
import CjxUpload from '@/uni_modules/cjx-upload/components/cjx-upload/cjx-upload.vue';
import CjxPreviewOffice from '@/uni_modules/cjx-previewOffice/components/cjx-previewOffice/cjx-previewOffice.vue';
import { QINIU_URL, QINIU_UPLOAD_URL } from '@/utils/request';
import uniSwipeAction from '@/components/uni-swipe-action/components/uni-swipe-action/uni-swipe-action.vue';
import uniSwipeActionItem from '@/components/uni-swipe-action/components/uni-swipe-action-item/uni-swipe-action-item.vue';
import { fetchGetAllUserDataList, fetchGetUploadFileTokenInfo, fetchGetPrjInfo, fetchUpdatePrjInfo, fetchGetContractsPageByPrjId, fetchGetPrjMemberDataList, fetchGetDebugBusinessDataList, fetchGetDebugEquipmentDataList, fetchGetPrjCustomerDataList, fetchGetPrjDevelopmentDataList, fetchSavePrjFileInfo, fetchGetPrjFileDataList, fetchDeletePrjMemberInfo, fetchDeleteDebugEquipmentInfo, fetchDeleteDebugBusinessInfo, fetchDeletePrjCustomerInfo, fetchDeletePrjDevelopmentInfo, fetchUpdateDebugBusinessInfo, fetchDeletePrjFileDetailInfo, fetchDeletePrjFileInfo, fetchUpdateDebugEquipmentInfo, fetchGetPrjdailyreportList, fetchGetPrjSummaryList, fetchGetPrjmojiDataList, fetchGetProjectParticipantDataList, fetchDeleteProjectParticipantInfo, fetchSaveProjectParticipantInfo } from '@/service/index';

const { themeVars, theme } = useTheme();

const message = useMessage();

const store = useLargeArrayStore();

const clickLock = ref<boolean>(false);

const pronameTitle = ref<string>('');

const activeTab = ref<number>(0);

const isDark = computed(() => theme.value === 'dark');

const userType = ref<number>(uni.getStorageSync('usertype'));

const selectedUploadfileType = ref<number>(0);

const uploadFileVisibleShow = ref<boolean>(false);

const uploadFileFileList = ref<any[]>([]);

// 一键清点设备
const equipmentManageVisible = ref<boolean>(false);
const inventoryDeiceLoading = ref<boolean>(false);
const checkedAllDevice = ref<boolean>(false);

const businessType = ref<number>(-99);

// 项目参与人
const participantsLoading = ref<boolean>(false);
const participantsShow = ref<boolean>(false);

// 项目参与人Id集合
const originSelectedParticipantsIdList = ref<any[]>([]);
const selectedParticipantsIdList = ref<any[]>([]);

// 获取所有调试工程师、项目负责人
const allUserDataList = ref<any[]>([]);

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

const options = ref<any>(hasPermission('project:File:delete') ? [
    {
        text: '删除',
        style: {
            backgroundColor: '#dd524d'
        }
    }
] : []);

const equipmentOptions = ref<any>(hasPermission('project:Equipment:delete') ? [
    {
        text: '删除',
        style: {
            backgroundColor: '#dd524d'
        }
    }
] : []);

const debugOptions = ref<any>(hasPermission('project:Debug:delete') ? [
    {
        text: '删除',
        style: {
            backgroundColor: '#dd524d'
        }
    }
] : []);

const contactOptions = ref<any>(hasPermission('project:Contact:delete') ? [
    {
        text: '删除',
        style: {
            backgroundColor: '#dd524d'
        }
    }
] : []);

const customerOptions = ref<any>(hasPermission('project:Customer:delete') ? [
    {
        text: '删除',
        style: {
            backgroundColor: '#dd524d'
        }
    }
] : []);

const developmentOptions = ref<any>(hasPermission('project:Development:delete') ? [
    {
        text: '删除',
        style: {
            backgroundColor: '#dd524d'
        }
    }
] : []);

const projectParticipantOptions = ref<any>(hasPermission('project:Participant:delete') ? [
    {
        text: '删除',
        style: {
            backgroundColor: '#dd524d'
        }
    }
] : []);

const tabsList = ref<{ title: string, value: number }[]>(userType.value === 0 || userType.value === 2 ? [
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
        title: '项目文件',
        value: 3
    },
    {
        title: '联系人',
        value: 4
    },
    {
        title: '需求变更',
        value: 5
    },
    {
        title: '需要开发',
        value: 6
    },
	{
	    title: '项目总结',
	    value: 7
	},
	{
	    title: '项目日报',
	    value: 8
	},
	{
	    title: '气象信息',
	    value: 9
	},
	{
	    title: '项目参与人',
	    value: 10
	},
	// {
	//     title: '合同列表',
	//     value: 11
	// }
] : [
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
        title: '项目文件',
        value: 3
    },
    {
        title: '联系人',
        value: 4
    },
    {
        title: '需求变更',
        value: 5
    },
    {
        title: '需要开发',
        value: 6
    },
	{
	    title: '项目总结',
	    value: 7
	},
	{
	    title: '项目日报',
	    value: 8
	},
	{
	    title: '气象信息',
	    value: 9
	},
	// {
	//     title: '合同列表',
	//     value: 11
	// }
]);

// 滚动高度集合
const tabScrollTop = ref<any[]>(userType.value === 0 || userType.value === 2 ? [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

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
    prjrRquirementsChangePage: number;
    prjrRquirementsChangeTotal: number;
    prjNeedDevelopmentPage: number;
    prjNeedDevelopmentTotal: number;
	prjSummaryPage: number;
	prjSummaryTotal: number;
	prjDailyPage: number;
	prjDailyTotal: number;
	prjMojiPage: number;
	prjMojiTotal: number;
	projectParticipantPage: number;
	projectParticipantTotal: number;
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
    prjContractPrjFileTotal: 0,
    prjrRquirementsChangePage: 1,
    prjrRquirementsChangeTotal: 0,
    prjNeedDevelopmentPage: 1,
    prjNeedDevelopmentTotal: 0,
	prjSummaryPage: 1,
	prjSummaryTotal: 0,
	prjDailyPage: 1,
	prjDailyTotal: 0,
	prjMojiPage: 1,
	prjMojiTotal: 0,
	projectParticipantPage: 1,
	projectParticipantTotal: 0
})

interface DebugbussinessItem {
    id: number;
    debugname: string;
    docker: string;
    dockcharge: string;
    dockcontact: string;
    debugresult: string;
    status: number;
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
    tname: string;
    dbusername: string;
    dbdbtime: string;
    dedbtime: string;
    duration: number;
    ckusername: string;
    ckdbtime: string;
    eqmname: string;
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
    status: number;
	devstatus: number;
	install: number;
	connectionmode: string;
	manucontact: string;
	manuinfo: string;
    dcreater: number;
    ddbtime: string;
}

interface ContractItem {
    id: number;
    contractname: string;
    contractnum: string;
    businesscon: string;
    businessinfo: string;
    precautions: string;
    dbtime: string;
    username: string;
}

interface MemberItem {
    id: number;
    pname: string;
    docker: string;
    pcontact: string;
    proposition: string;
    username: string;
    dbtime: string;
}

interface projectParticipantItem {
    id: number;
    pid: any;
    participant: string;
    prtcname: string;
    username: string;
    dbtime: string;
}

const prjDetailInfo = reactive({
    id: '',
    ckdbtime: "",
    ckusername: "",
    cpdbtime: "",
    dbtime: "",
    dispatch: "",
    dtype: 0,
    latitude: 0,
    longitude: 0,
    period: 0,
    proaddr: "",
    progess: 0,
    proname: "",
    prosite: "",
    ptype: 0,
    sdbtime: "",
    status: 0,
    username: "",
	debugs: 0,
	summarys: 0,
	dailys: 0,
	businesscon: '',
	projectParticipantNames: '',
    contractDataList: [] as ContractItem[],
    memberDataList: [] as MemberItem[],
    debugBussinessList: [] as DebugbussinessItem[],
    debugEquipmentList: [] as DebugequipmentItem[],
    fileList: [] as any[],
    requirementsChangeList: [] as any[],
    needDevelopList: [] as any[],
	prjSummaryDataList: [] as any[],
	prjDailyDataList: [] as any[],
	prjMojiDataList: [] as any[],
	projectParticipantDataList: [] as any[]
})

// 项目图纸列表
const projectDrawingsFileList = ref<any[]>([]);

// 项目文件列表
const ipAddressList = ref<any[]>([]);

// 工程文件压缩包列表
const projectFileList = ref<any[]>([]);

// 项目现场照片文件列表
const fileList = ref<any[]>([]);

// 网络通讯简图
const networkCommunicationDiagramFileList = ref<any[]>([]);

// 组态画面工程备份
const configurationProjectBackupFileList = ref<any[]>([]);

// 验收确认单拍照照片文件列表
const acceptanceConfirmationFileList = ref<any[]>([]);

function handleClickLeft() {
    // #ifdef H5
    history.go(-1);
    // #endif

    // #ifndef H5
    uni.navigateBack();
    // #endif
}

// 获取项目详情
async function getContractDetailInfo() {
    try {
        const data = await fetchGetPrjInfo((prjDetailInfo.id as any));
        prjDetailInfo.ckdbtime = data.ckdbtime;
        prjDetailInfo.ckusername = data.ckusername;
        prjDetailInfo.cpdbtime = data.cpdbtime;
        prjDetailInfo.dbtime = data.dbtime;
        prjDetailInfo.dispatch = data.dispatch || '';
        prjDetailInfo.dtype = data.dtype;
        prjDetailInfo.longitude = data.longitude;
        prjDetailInfo.latitude = data.latitude;
        prjDetailInfo.period = data.period;
        prjDetailInfo.proaddr = data.proaddr;
        prjDetailInfo.progess = data.progess || 0;
        prjDetailInfo.proname = data.proname;
        prjDetailInfo.prosite = data.prosite;
        prjDetailInfo.ptype = data.ptype;
        prjDetailInfo.sdbtime = data.sdbtime;
        prjDetailInfo.status = data.status;
		prjDetailInfo.businesscon = data.businesscon;
        prjDetailInfo.username = data.username;
		prjDetailInfo.debugs = data.debugs || 0;
		prjDetailInfo.summarys = data.summarys || 0;
		prjDetailInfo.dailys = data.dailys || 0;
		pronameTitle.value = data.proname;
    } catch (err) {
        console.error('获取项目信息失败', err);
    }
}

// 拨打电话
function handleMakePhoneNumber(phoneNumber: string) {
    uni.makePhoneCall({
        phoneNumber
    })
}

// 打开地图
function handleOpenMapChange(longitude: number | null, latitude: number | null) {
    if (longitude && latitude) {
        uni.openLocation({
            longitude,
            latitude
        })
    }
}

// 获取项目合同
async function getPrjContractsDataList() {
    if (dataForm.contractPage === 1) {
        prjDetailInfo.contractDataList = [];
    }
    try {
        const data = await fetchGetContractsPageByPrjId({ page: dataForm.contractPage, limit: 100, id: prjDetailInfo.id });
        dataForm.contractTotal = Number(data.total);
        prjDetailInfo.contractDataList = prjDetailInfo.contractDataList.concat(data.list);
    } catch (err) {
        console.error('获取项目合同失败', err);
    }
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
        const data = await fetchGetPrjMemberDataList({ page: dataForm.prjMemberPage, limit: 100, pid: prjDetailInfo.id, fuzzy: searchForm.username });
        dataForm.prjMemberTotal = Number(data.total);
        prjDetailInfo.memberDataList = prjDetailInfo.memberDataList.concat(data.list);
    } catch (err) {
        console.error('获取项目成员失败', err);
    }
}

// 调试任务跳转
function handleDebugBussinessChange() {
	if (prjDetailInfo.debugs > 0) {
		activeTab.value = 2;
	}
}

// 项目总结、日报数量跳转
function handleJumpPageChange(url: string) {
    if (url) {
        uni.navigateTo({
            url
        })
    }
}

// 页面跳转
function handleJumpChange(currentTab: number, url: string | null) {
	try {
		if (clickLock.value) return;
		clickLock.value = true;
		if (url) {
		    uni.navigateTo({
		        url,
				complete: () => {
					clickLock.value = false;
				}
		    })
		} else {
		    if (currentTab === 1) {
		        uni.navigateTo({
		            url: '/projectPages/adddebugequipment/Index?pid=' + prjDetailInfo.id,
					complete: () => {
						clickLock.value = false;
					}
		        })
		    } else if (currentTab === 2) {
		        uni.navigateTo({
		            url: '/projectPages/adddebugbusiness/Index?pid=' + prjDetailInfo.id,
					complete: () => {
						clickLock.value = false;
					}
		        })
		    } else if (currentTab === 4) {
		        uni.navigateTo({
		            url: '/projectPages/addprjmember/Index?pid=' + prjDetailInfo.id,
					complete: () => {
						clickLock.value = false;
					}
		        })
		    }  else if (currentTab === 5) {
		        uni.navigateTo({
		            url: '/projectPages/addrequiredchange/Index?pid=' + prjDetailInfo.id,
					complete: () => {
						clickLock.value = false;
					}
		        })
		    } else if (currentTab === 6) {
		        uni.navigateTo({
		            url: '/projectPages/addneeddevelop/Index?pid=' + prjDetailInfo.id,
					complete: () => {
						clickLock.value = false;
					}
		        })
		    } else if (currentTab === 7) {
		        uni.navigateTo({
		            url: '/projectPages/addprjsummary/Index?pid=' + prjDetailInfo.id,
					complete: () => {
						clickLock.value = false;
					}
		        })
		    } else if (currentTab === 8) {
		        uni.navigateTo({
		            url: '/mePages/addtechnicalsupportdaily/Index?pid=' + prjDetailInfo.id,
					complete: () => {
						clickLock.value = false;
					}
		        })
		    } else if (currentTab === 10) {
		        uni.navigateTo({
		            url: '/projectPages/addparticipant/Index?pid=' + prjDetailInfo.id,
					complete: () => {
						clickLock.value = false;
					}
		        })
		    }
		}
	} catch (error) {
		console.log('error', error);
		clickLock.value = false;
	}
}

// 获取调试设备列表
async function getContractDebugEquipmentDataList() {
    if (dataForm.prjDebugEquipmentPage === 1) {
        prjDetailInfo.debugEquipmentList = [];
    }
    try {
        const data = await fetchGetDebugEquipmentDataList({ page: dataForm.prjDebugEquipmentPage, limit: 100, pid: prjDetailInfo.id, fuzzy: searchForm.devname });
        dataForm.prjDebugEquipmentTotal = Number(data.total);
        prjDetailInfo.debugEquipmentList = prjDetailInfo.debugEquipmentList.concat(data.list);
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
        const data = await fetchGetDebugBusinessDataList({ page: dataForm.prjDebugBusinessPage, limit: 100, pid: prjDetailInfo.id, fuzzy: searchForm.businessname, status: businessType.value === -99 ? null : businessType.value });
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
        projectFileList.value = [];
        fileList.value = [];
        networkCommunicationDiagramFileList.value = [];
        configurationProjectBackupFileList.value = [];
        acceptanceConfirmationFileList.value = [];
        prjDetailInfo.fileList = [];
    }
    try {
        const data = await fetchGetPrjFileDataList({ page: dataForm.prjContractPrjFilePage, limit: 100,  pid: prjDetailInfo.id });
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
            } else if (item.sort === 3) {
                projectFileList.value.push({
                    id: item.id,
                    url: item.file,
                    filename: item.filename,
                    username: item.username,
                    dbtime: item.dbtime
                })
            } else if (item.sort === 4) {
                fileList.value.push({
                    id: item.id,
                    url: item.file,
                    filename: item.filename,
                    username: item.username,
                    dbtime: item.dbtime
                })
            } else if (item.sort === 5) {
                networkCommunicationDiagramFileList.value.push({
                    id: item.id,
                    url: item.file,
                    filename: item.filename,
                    username: item.username,
                    dbtime: item.dbtime
                })
            } else if (item.sort === 6) {
                configurationProjectBackupFileList.value.push({
                    id: item.id,
                    url: item.file,
                    filename: item.filename,
                    username: item.username,
                    dbtime: item.dbtime
                })
            } else if (item.sort === 7) {
                acceptanceConfirmationFileList.value.push({
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

// 获取客户需求变更列表
async function getPrjCustomerDataList() {
    if (dataForm.prjrRquirementsChangePage === 1) {
        prjDetailInfo.requirementsChangeList = [];
    }
    try {
        const data = await fetchGetPrjCustomerDataList({ page: dataForm.prjrRquirementsChangePage, limit: 100, pid: prjDetailInfo.id });
        dataForm.prjrRquirementsChangeTotal = Number(data.total);
        prjDetailInfo.requirementsChangeList = prjDetailInfo.requirementsChangeList.concat(data.list);
    } catch (err) {
        console.error('获取客户需求变更列表失败', err);
    }
}

// 获取需要开发列表
async function getPrjDevelopmentDataList() {
    if (dataForm.prjNeedDevelopmentPage === 1) {
        prjDetailInfo.needDevelopList = [];
    }
    try {
        const data = await fetchGetPrjDevelopmentDataList({ page: dataForm.prjNeedDevelopmentPage, limit: 100, pid: prjDetailInfo.id });
        dataForm.prjNeedDevelopmentTotal = Number(data.total);
        prjDetailInfo.needDevelopList = prjDetailInfo.needDevelopList.concat(data.list);
    } catch (err) {
        console.error('获取项目信息失败', err);
    }
}

// 获取项目总结
async function getPrjSummaryDataList() {
    if (dataForm.prjSummaryPage === 1) {
        prjDetailInfo.prjSummaryDataList = [];
    }
    try {
        const data = await fetchGetPrjSummaryList({ page: dataForm.prjSummaryPage, limit: 100, pid: prjDetailInfo.id });
        dataForm.prjSummaryTotal = Number(data.total);
        prjDetailInfo.prjSummaryDataList = prjDetailInfo.prjSummaryDataList.concat(data.list);
    } catch (err) {
        console.error('获取项目总结失败', err);
    }
}

// 获取项目日报
async function getPrjDailyDataList() {
    if (dataForm.prjDailyPage === 1) {
        prjDetailInfo.prjDailyDataList = [];
    }
    try {
        const data = await fetchGetPrjdailyreportList({ page: dataForm.prjDailyPage, limit: 100, pid: prjDetailInfo.id });
        dataForm.prjSummaryTotal = Number(data.total);
		prjDetailInfo.prjDailyDataList = prjDetailInfo.prjDailyDataList.concat(data.list.map((item: any) => {
		    let context = item.context;
		    try {
		        const parsed = JSON.parse(item.context)
		        context = parsed;
		    } catch (e) {
		        // 不是合法 JSON，就保持原样
		    }
		    return {
		        ...item,
		        context,
		        commentList: [],
		        isObject: typeof context === 'string' ? false : true,
		        content: item.hasOwnProperty('content') ? item.content : '',
		    }
		}));
    } catch (err) {
        console.error('获取项目日报失败', err);
    }
}

// 获取气象信息
async function getPrjMojiDataList() {
    if (dataForm.prjMojiPage === 1) {
        prjDetailInfo.prjMojiDataList = [];
    }
    try {
        const data = await fetchGetPrjmojiDataList({ page: dataForm.prjMojiPage, limit: 100, pid: prjDetailInfo.id });
        dataForm.prjMojiTotal = Number(data.total);
        prjDetailInfo.prjMojiDataList = prjDetailInfo.prjMojiDataList.concat(data.list);
    } catch (err) {
        console.error('获取气象信息失败', err);
    }
}

// 获取项目参与人
async function getProjectParticipantDataList() {
	prjDetailInfo.projectParticipantNames = "";
    if (dataForm.projectParticipantPage === 1) {
        prjDetailInfo.projectParticipantDataList = [];
    }
    try {
        const data = await fetchGetProjectParticipantDataList({ page: dataForm.projectParticipantPage, limit: 100, pid: prjDetailInfo.id });
        dataForm.projectParticipantTotal = Number(data.total);
        prjDetailInfo.projectParticipantDataList = prjDetailInfo.projectParticipantDataList.concat(data.list);
		prjDetailInfo.projectParticipantDataList.forEach((item: any) => {
			if (item.hasOwnProperty('prtcname')) {
				prjDetailInfo.projectParticipantNames += item.prtcname + ',';
			}
		});
		if (prjDetailInfo.projectParticipantNames) {
			prjDetailInfo.projectParticipantNames = prjDetailInfo.projectParticipantNames.substring(0, prjDetailInfo.projectParticipantNames.length - 1);
		}
    } catch (err) {
        console.error('获取项目参与人失败', err);
		originSelectedParticipantsIdList.value = ['1010', '1020'];
		selectedParticipantsIdList.value = ['1010', '1020'];
    }
}

// 复制
async function handleCopyChange(val: string) {
    try {
        await copyText(val);
        uni.showToast({ title: '复制成功', icon: 'success' });
    } catch (err) {
        if (err instanceof Error) {
            uni.showToast({ title: err.message, icon: 'none' });
        }
    }
}

// 删除操作
async function handleDeleteDiffTypeChange(id: number) {
    try {
        message
        .confirm({
            msg: '确定要删除该' + (activeTab.value === 1 ? '调试设备' : activeTab.value === 2 ? '调试业务' : activeTab.value === 4 ? '联系人' : activeTab.value === 5 ? '需求变更' : activeTab.value === 6 ? '需要开发' : activeTab.value === 10 ? '项目参与人' : '调试设备') + '吗？',
            title: '提示',
            confirmButtonProps: {
                type: 'error',
            },
        })
        .then(async () => {
            if (activeTab.value === 1) {
                if (!hasPermission('project:Equipment:delete')) {
                    uni.showToast({
                        icon: 'none',
                        title: '暂无删除调试设备权限，请联系管理员',
                        duration: 1500
                    })
                    return
                }
            } else if (activeTab.value === 2) {
                if (!hasPermission('project:Debug:delete')) {
                    uni.showToast({
                        icon: 'none',
                        title: '暂无删除调试业务权限，请联系管理员',
                        duration: 1500
                    })
                    return
                }
            } else if (activeTab.value === 4) {
                if (!hasPermission('project:Contact:delete')) {
                    uni.showToast({
                        icon: 'none',
                        title: '暂无删除联系人权限，请联系管理员',
                        duration: 1500
                    })
                }
                return
            } else if (activeTab.value === 5) {
                if (!hasPermission('project:Customer:delete')) {
                    uni.showToast({
                        icon: 'none',
                        title: '暂无删除需求变更权限，请联系管理员',
                        duration: 1500
                    })
                    return
                }
            } else if (activeTab.value === 6) {
                if (!hasPermission('project:Development:delete')) {
                    uni.showToast({
                        icon: 'none',
                        title: '暂无删除需要开发权限，请联系管理员',
                        duration: 1500
                    })
                    return
                }
            } else if (activeTab.value === 10) {
                if (!hasPermission('project:Participant:delete')) {
                    uni.showToast({
                        icon: 'none',
                        title: '暂无删除项目参与人权限，请联系管理员',
                        duration: 1500
                    })
                    return
                }
            }
            const data = activeTab.value === 1 ? fetchDeleteDebugEquipmentInfo(id) : activeTab.value === 2 ? await fetchDeleteDebugBusinessInfo(id, Number(prjDetailInfo.id)) : activeTab.value === 4 ? await fetchDeletePrjMemberInfo(id) : activeTab.value === 5 ? fetchDeletePrjCustomerInfo(id) : activeTab.value === 6 ? fetchDeletePrjDevelopmentInfo(id) : activeTab.value === 10 ? fetchDeleteProjectParticipantInfo(id) : '';
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
                    } else if (activeTab.value === 5) {
                        dataForm.prjrRquirementsChangePage = 1;
                        getPrjCustomerDataList();
                    } else if (activeTab.value === 6) {
                        dataForm.prjNeedDevelopmentPage = 1;
                        getPrjDevelopmentDataList();
                    } else if (activeTab.value === 10) {
                        dataForm.projectParticipantPage = 1;
                        getProjectParticipantDataList();
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
        if (!hasPermission('project:File:delete')) {
            uni.showToast({
                icon: 'none',
                title: '暂无删除项目文件权限，请联系管理员',
                duration: 1500
            })
            return
        }
        try {
            const data = await fetchDeletePrjFileDetailInfo(url.includes("?") ? url.split("?")[0] : url);
            const data2 = await fetchDeletePrjFileInfo(id);
            uni.showToast({
                icon: "none",
                title: "删除成功",
                duration: 1500,
                complete: async () => {
                    dataForm.prjContractPrjFilePage = 1;
					tabScrollTop.value[activeTab.value] = 0;
					nextTick(() => {
						handleGotoTopChange();
						getContractPrjFileInfo();
					})
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

// APP上传文件
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
		const data = await fetchSavePrjFileInfo(queryParams);
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

// 启动、审核项目
async function handleCheckPrjChange(id: any, status: number) {
    if (!hasPermission('project:Info:update')) {
        uni.showToast({
            icon: 'none',
            title: '暂无项目审核权限, 请联系管理员',
            duration: 1500
        })
        return
    }
    try {
        message
        .confirm({
            msg: '确定要审核完成该项目吗？',
            title: '提示',
            confirmButtonProps: {
                type: 'error',
            },
        })
        .then(async () => {
            const data = await fetchUpdatePrjInfo([{ id: id, status }]);
            uni.showToast({
                icon: "none",
                title: "审核已完成",
                duration: 1500,
                complete: async () => {
                    getContractDetailInfo();
                }
            })
        })
        .catch(() => {
            console.log('点击了取消按钮');
        });
    } catch (error) {
        console.error(status === 0 ? '项目核准失败' : status === 3 ? '审核项目失败' : '项目启动失败', error);
    }
}

// 更新调试状态
async function handleUpdateStatusChange(businessItem: any, status: number) {
    if (!hasPermission('project:Debug:update')) {
        uni.showToast({
            icon: 'none',
            title: '暂无修改调试状态权限, 请联系管理员',
            duration: 1500
        })
        return
    }
    try {
        message
        .confirm({
            msg: status === 0 ? '确定要通过申请吗？' : status === 1 ? '确定要开始调试吗？' : status === 2 ? '请确认资料已提交，否则将拒绝审核！' : status === 3 ? '确定已审核完成吗？' : '确定要开始调试吗？',
            title: status === 2 ? '确定已完成调试吗？' : '提示',
            confirmButtonProps: {
                type: 'error',
            },
        })
        .then(async () => {
            const data = await fetchUpdateDebugBusinessInfo([{ id: businessItem.id, pid: prjDetailInfo.id, status }]);
            uni.showToast({
                icon: "none",
                title: status === 0 ? '已通过申请' : status === 1 ? "已开始调试" : status === 2 ? '已完成调试' : '已审核完成',
                duration: 1500,
                complete: async () => {
                    dataForm.prjDebugBusinessPage = 1;
                    getContractDebugBusinessDataList();
					if (status === 3) {
						store.removeItemById(businessItem.id);
					}
                }
            })
        })
        .catch(() => {
            console.log('点击了取消按钮');
        });
    } catch (error) {
        console.error('修改调试状态失败', error);
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
    } else if (activeTab.value === 5) {
        dataForm.prjrRquirementsChangePage = 1;
        getPrjCustomerDataList();
    } else if (activeTab.value === 6) {
        dataForm.prjNeedDevelopmentPage = 1;
        getPrjDevelopmentDataList();
    } else if (activeTab.value === 7) {
        dataForm.prjSummaryPage = 1;
        getPrjSummaryDataList();
    } else if (activeTab.value === 8) {
        dataForm.prjDailyPage = 1;
        getPrjDailyDataList();
    } else if (activeTab.value === 9) {
        dataForm.prjMojiPage = 1;
        getPrjMojiDataList();
    }
}

// 管理
function handleDeviceManegeChange() {
	if (prjDetailInfo.debugEquipmentList.length === 0) {
		return
	}
	equipmentManageVisible.value = !equipmentManageVisible.value;
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

// 一键清点设备
async function handleInventoryDeiceChange() {
    try {
        const queryParams = checkedAllDevice.value ? prjDetailInfo.debugEquipmentList.map((item: any) => {
            if(item.status === 0) {
                return {
                    id: item.id,
                    status: 1
                }
            } else{
                return null
            }
        }).filter((item: any) => item !== null) : prjDetailInfo.debugEquipmentList.map((item: any) => {
            if(item.status === 0 && item.checked) {
                return {
                    id: item.id,
                    status: 1
                }
            } else{
                return null
            }
        }).filter((item: any) => item !== null)
        console.log('q', queryParams);
        if (queryParams.length === 0) {
            uni.showToast({
                title: '请选择待清点设备',
                icon: 'none',
                duration: 1500
            });
            return false
        }
        message
            .confirm({
                msg: '确定要一键清点设备吗？',
                title: '提示',
                confirmButtonProps: {
                    type: 'error',
                },
            })
            .then(async () => {
				inventoryDeiceLoading.value = true;
                const data = await fetchUpdateDebugEquipmentInfo(queryParams);
                uni.showToast({
                    title: '一键清点设备成功',
                    icon: 'none',
                    duration: 1500,
					complete: () => {
						inventoryDeiceLoading.value = false;
						dataForm.prjDebugEquipmentPage = 1;
						getContractDebugEquipmentDataList();
					}
                });
            })
            .catch(() => {
                console.log('点击了取消按钮');
            });
    } catch (err) {
        console.error('一键清点设备失败', err);
		inventoryDeiceLoading.value = false;
    }
}

// 获取所有用户列表
async function getAllUserDataList() {
	const data = await fetchGetAllUserDataList({ page: 1, limit: 100, usertypes: '2, 3, 9' });
	allUserDataList.value = data.list.filter(item => item.status !== 1);
}

// 打开项目参与人弹框
async function handleParticipantsPopupChange() {
	originSelectedParticipantsIdList.value = [];
	selectedParticipantsIdList.value = [];
	prjDetailInfo.projectParticipantDataList.forEach((item: any) => {
		selectedParticipantsIdList.value.push(item.participant);
		originSelectedParticipantsIdList.value.push(item.participant);
	});
	// await getProjectParticipantDataList();
	participantsLoading.value = false;
	participantsShow.value = true;
}

// 打开项目参与人弹框
async function handleParticipantsSubmitChange() {
	const newIds = selectedParticipantsIdList.value || [];
	const oldIds = originSelectedParticipantsIdList.value || [];
	// 新增的用户
	const addIds = newIds.filter(id => !oldIds.includes(id));
	// 删除的用户
	const delIds = oldIds.filter(id => !newIds.includes(id));
	if (addIds.length === 0 && delIds.length === 0) {
		participantsShow.value = false;
		return
	}
	participantsLoading.value = true;
	try {
	    if (addIds.length > 0) {
			const data = await fetchSaveProjectParticipantInfo(addIds.map((item:any)=>({ pid: prjDetailInfo.id, participant:item })))
	    }
	    if (delIds.length > 0){
			const ids = prjDetailInfo.projectParticipantDataList.filter((item:any) => delIds.includes(item.participant)).map((row: any) => row.id).join(',');
			if (ids.length > 0) {
				const data1 = await fetchDeleteProjectParticipantInfo(ids);
			}
	    }
		participantsShow.value = false;
		participantsLoading.value = false;
		dataForm.projectParticipantPage = 1;
	    await getProjectParticipantDataList();
	} catch (err) {
	    console.error(err);
		participantsLoading.value = false;
	}
}

onLoad((options: any) => {
    prjDetailInfo.id = options.pid;
	if (options.hasOwnProperty('proname')) {
		pronameTitle.value = decodeURIComponent(options.proname);
	}
    activeTab.value = options.hasOwnProperty('activeTab') ? Number(options.activeTab) || 0 : 0;
    getContractDetailInfo();
    // getPrjContractsDataList();
    getContractDebugEquipmentDataList();
    getContractDebugBusinessDataList();
    getContractPrjFileInfo();
    getPrjMemberDataList();
    getPrjCustomerDataList();
    getPrjDevelopmentDataList();
	getPrjSummaryDataList();
	getPrjDailyDataList();
	getPrjMojiDataList();
	if (userType.value === 0 || userType.value === 2) {
		getAllUserDataList();
		getProjectParticipantDataList();
	}
    uni.$on('refreshList', getDataList); // 监听刷新事件
});

onPageScroll((e: any) => {
	tabScrollTop.value[activeTab.value] = e.scrollTop;
})

onUnload(() => {
    uni.$off('refreshList', getDataList); // 页面销毁时解绑
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
    } else if (activeTab.value === 5) {
        dataForm.prjrRquirementsChangePage = 1;
        getPrjCustomerDataList();
    } else if (activeTab.value === 6) {
        dataForm.prjNeedDevelopmentPage = 1;
        getPrjDevelopmentDataList();
    } else if (activeTab.value === 7) {
        dataForm.prjSummaryPage = 1;
        getPrjSummaryDataList();
    } else if (activeTab.value === 8) {
        dataForm.prjDailyPage = 1;
        getPrjDailyDataList();
    } else if (activeTab.value === 9) {
        dataForm.prjMojiPage = 1;
        getPrjMojiDataList();
    } else if (activeTab.value === 10) {
        dataForm.projectParticipantPage = 1;
        getProjectParticipantDataList();
    }
    // else if (activeTab.value === 1) {
    //     dataForm.contractPage = 1;
    //     getPrjContractsDataList();
    // }
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
    } else if (activeTab.value === 5) {
        if (prjDetailInfo.requirementsChangeList.length < dataForm.prjrRquirementsChangeTotal) {
            dataForm.prjrRquirementsChangePage++;
            getPrjCustomerDataList();
        }
    } else if (activeTab.value === 6) {
        if (prjDetailInfo.needDevelopList.length < dataForm.prjNeedDevelopmentTotal) {
            dataForm.prjNeedDevelopmentPage++;
            getPrjDevelopmentDataList();
        }
    } else if (activeTab.value === 7) {
		if (prjDetailInfo.prjSummaryDataList.length < dataForm.prjSummaryTotal) {
			dataForm.prjSummaryPage++;
			getPrjSummaryDataList();
		}
    } else if (activeTab.value === 8) {
		if (prjDetailInfo.prjDailyDataList.length < dataForm.prjDailyTotal) {
			dataForm.prjDailyPage++;
			getPrjDailyDataList();
		}
    } else if (activeTab.value === 9) {
		if (prjDetailInfo.prjMojiDataList.length < dataForm.prjMojiTotal) {
			dataForm.prjMojiPage++;
			getPrjMojiDataList();
		}
    } else if (activeTab.value === 10) {
		if (prjDetailInfo.projectParticipantDataList.length < dataForm.projectParticipantTotal) {
			dataForm.projectParticipantPage++;
			getProjectParticipantDataList();
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
				<wd-button type="text" v-if="activeTab === 1 && prjDetailInfo.debugEquipmentList.length > 0 && hasPermission('project:Equipment:update')" @click="handleDeviceManegeChange">管理</wd-button>
                <wd-button v-if="(activeTab === 1 && hasPermission('project:Equipment:insert')) || (activeTab === 2 && hasPermission('project:Debug:insert')) || (activeTab === 4 && hasPermission('project:Contact:insert')) || (activeTab === 5 && hasPermission('project:Customer:insert')) || (activeTab === 6 && hasPermission('project:Development:insert')) || (activeTab === 7 && hasPermission('project:Summary:insert')) || (activeTab === 8 && hasPermission('project:DailyReport:insert')) || (activeTab === 10 && hasPermission('project:Participant:insert'))" type="icon" icon="add-circle" size="large" @click="handleJumpChange(activeTab, null)"></wd-button>
            </template>
        </wd-navbar>

        <wd-tabs animated v-model="activeTab" @change="handleTabsChange">
            <block v-for="(item, index) in tabsList" :key="index">
                <!-- <wd-tab :title="item.title" :disabled="index === 5 ? (prjDetailInfo.cs === 0 ? true : false) : index === 6 ? (prjDetailInfo.ds === 0 ? true : false) : false"> -->
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
						<!-- <wd-radio-group v-if="activeTab === 2" v-model="businessType" shape="button" cell inline @change="dataForm.prjDebugBusinessPage = 1; getContractDebugBusinessDataList();">
							<wd-radio :value="-99">全部</wd-radio>
							<wd-radio :value="-1">申请中</wd-radio>
							<wd-radio :value="0">待调试</wd-radio>
							<wd-radio :value="1">开始调试</wd-radio>
							<wd-radio :value="2">待审核</wd-radio>
							<wd-radio :value="3">审核完成</wd-radio>
						</wd-radio-group> -->
						<scroll-view scroll-x v-if="activeTab === 2" :style="{ width: 'calc(100vw - 20rpx)', padding: '10rpx 10rpx 0', background: isDark ? '#1b1b1b': '#FFFFFF' }">
							<wd-radio-group style="display: flex; align-items: center;" v-model="businessType" shape="button" @change="dataForm.prjDebugBusinessPage = 1; getContractDebugBusinessDataList();">
								<wd-radio :value="-99">全部</wd-radio>
								<wd-radio :value="-1">申请中</wd-radio>
								<wd-radio :value="0">待调试</wd-radio>
								<wd-radio :value="1">开始调试</wd-radio>
								<wd-radio :value="2">待审核</wd-radio>
								<wd-radio :value="3">审核完成</wd-radio>
							</wd-radio-group>
						</scroll-view>
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
						<scroll-view scroll-x v-if="activeTab === 2" style="width: calc(100vw - 40rpx); padding: 0 20rpx; background-color: #FFFFFF;">
							<wd-radio-group style="display: flex; align-items: center;" v-model="businessType" shape="button" @change="dataForm.prjDebugBusinessPage = 1; getContractDebugBusinessDataList();">
								<wd-radio :value="-99">全部</wd-radio>
								<wd-radio :value="-1">申请中</wd-radio>
								<wd-radio :value="0">待调试</wd-radio>
								<wd-radio :value="1">开始调试</wd-radio>
								<wd-radio :value="2">待审核</wd-radio>
								<wd-radio :value="3">审核完成</wd-radio>
							</wd-radio-group>
						</scroll-view>
						<!-- <wd-radio-group v-if="activeTab === 2" v-model="businessType" shape="button" cell inline @change="dataForm.prjDebugBusinessPage = 1; getContractDebugBusinessDataList();">
							<wd-radio :value="-99">全部</wd-radio>
							<wd-radio :value="-1">申请中</wd-radio>
							<wd-radio :value="0">待调试</wd-radio>
							<wd-radio :value="1">开始调试</wd-radio>
							<wd-radio :value="2">待审核</wd-radio>
							<wd-radio :value="3">审核完成</wd-radio>
						</wd-radio-group> -->
					</wd-sticky>
					<!-- #endif -->
				</wd-tab>
			</block>
		</wd-tabs>
					
		<wd-gap :bg-color="isDark ? '#000000' : '#F5F5F5'" :height="activeTab === 3 ? '95rpx' : '105rpx'" />

		<view v-if="activeTab === 0">
			<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '0 20rpx 40rpx', borderRadius: '20rpx' }">
				<view style="padding: 5rpx;">
					<wd-cell title="项目名称" :value="prjDetailInfo.proname" custom-class="customCell" />
					<wd-cell title="调度名称" :value="prjDetailInfo.dispatch || '--'" custom-class="customCell" />
					<wd-cell title="当前进度" custom-class="customCell">
						<wd-progress color="#4d80f0" :percentage="prjDetailInfo.progess" />
					</wd-cell>
					<wd-cell title="项目周期(天)" :value="prjDetailInfo.period" custom-class="customCell" />
					<wd-cell title="开始时间" :value="prjDetailInfo.sdbtime || '--'" custom-class="customCell" />
					<wd-cell title="预计完成时间" :value="prjDetailInfo.cpdbtime || '--'" custom-class="customCell" />
					<wd-cell title="项目状态" custom-class="customCell">
						<wd-tag round :type="prjDetailInfo.status === -1 ? 'default' : prjDetailInfo.status === 0 ? 'default' : prjDetailInfo.status === 1 ? 'primary' : prjDetailInfo.status === 2 ? 'warning' : prjDetailInfo.status === 3 ? 'success' : 'primary'">
							{{ prjDetailInfo.status === -1 ? '未核准' : prjDetailInfo.status === 0 ? '未开始' : prjDetailInfo.status === 1 ? '进行中' : prjDetailInfo.status === 2 ? '待审核' : prjDetailInfo.status === 3 ? '已完成' : '未知'  }}
						</wd-tag>
					</wd-cell>
					<wd-cell title="完成情况" custom-class="customCell">
						<wd-tag round :type="prjDetailInfo.ptype === 0 ? 'success' : prjDetailInfo.ptype === 1 ? 'warning' : prjDetailInfo.ptype === 2 ? 'danger' : 'default'">
							{{ prjDetailInfo.ptype === 0 ? '正常' : prjDetailInfo.ptype === 1 ? '延期' : prjDetailInfo.ptype === 2 ? '作废' : '未知'  }}
						</wd-tag>
					</wd-cell>
					<wd-cell title="验收人" v-if="prjDetailInfo.status === 3" :value="prjDetailInfo.ckusername || '--'" custom-class="customCell" />
					<wd-cell title="验收时间" v-if="prjDetailInfo.status === 3" :value="prjDetailInfo.ckdbtime" custom-class="customCell" />
					<wd-cell title="调试类型" custom-class="customCell">
						<wd-tag type="primary" round>
							{{ prjDetailInfo.dtype === 0 ? '现场调试' : prjDetailInfo.dtype === 1 ? '远程调试' : prjDetailInfo.dtype === 2 ? '无需调试' : '未知' }}
						</wd-tag>
					</wd-cell>
					<wd-cell v-if="hasPermission('project:Participant:select') || hasPermission('project:Participant:insert') || hasPermission('project:Participant:update') || hasPermission('project:Participant:delete')" title="项目参与人" custom-class="customCell">
						<view style="display: flex; justify-content: space-between; align-items: center;">
							<view style="margin-right: 5px;">{{ prjDetailInfo.projectParticipantNames }}</view>
							<wd-icon name="setting" size="20px" @click.stop="handleParticipantsPopupChange"></wd-icon>
						</view>
					</wd-cell>
					<!-- <wd-cell v-if="prjDetailInfo.projectParticipantNames" title="项目参与人" custom-class="customCell">
						<view style="display: flex; justify-content: space-between; align-items: center;">
							<view style="margin-right: 5px;">{{ prjDetailInfo.projectParticipantNames }}</view>
							<wd-icon name="setting" size="20px" @click.stop="handleParticipantsPopupChange"></wd-icon>
						</view>
					</wd-cell> -->
					<!-- <wd-cell v-if="prjDetailInfo.projectParticipantNames" title="项目参与人" custom-class="customCell">
						<view style="display: flex; justify-content: space-between; align-items: center;">
							<view style="margin-right: 5px;">{{ prjDetailInfo.projectParticipantNames }}</view>
							<wd-icon name="setting" size="20px" @click.stop="activeTab = 10"></wd-icon>
						</view>
					</wd-cell> -->
					<wd-cell title="项目地址" :value="prjDetailInfo.prosite" custom-class="customCell">
						<view style="display: flex; justify-content: space-between; align-items: center;">
							<view style="margin-right: 5px;">{{ prjDetailInfo.prosite }}</view>
							<wd-icon name="location" size="24px" @click="handleOpenMapChange(prjDetailInfo.longitude, prjDetailInfo.latitude)"></wd-icon>
						</view>
					</wd-cell>
					<wd-cell title="项目详细地址" :value="prjDetailInfo.proaddr" custom-class="customCell"></wd-cell>
					<wd-cell title="调试任务数" custom-class="cellClass" clickable @click="handleDebugBussinessChange">
						<wd-text bold :text="prjDetailInfo.debugs" size="14px" :color="prjDetailInfo.debugs === 0 ? '#cccccc' : isDark ? '#ffffff' : '#000000'" />
					</wd-cell>
					<wd-cell title="项目总结数" custom-class="cellClass" clickable @click="handleJumpPageChange(prjDetailInfo.summarys > 0 ? '/projectPages/prjsummarypage/Index?pid=' + prjDetailInfo.id + '&pname=' + encodeURIComponent(prjDetailInfo.proname) : '')">
						<wd-text bold :text="prjDetailInfo.summarys" size="14px" :color="prjDetailInfo.summarys === 0 ? '#cccccc' : isDark ? '#ffffff' : '#000000'" />
					</wd-cell>
					<wd-cell title="日报数" custom-class="cellClass" clickable @click="handleJumpPageChange(prjDetailInfo.dailys > 0 ? '/mePages/technicalsupportdaily/Index?pid=' + prjDetailInfo.id + '&pname=' + encodeURIComponent(prjDetailInfo.proname) : '')">
						<wd-text bold :text="prjDetailInfo.dailys" size="14px" :color="prjDetailInfo.dailys === 0 ? '#cccccc' : isDark ? '#ffffff' : '#000000'" />
					</wd-cell>
					<wd-cell title="商务联系人" custom-class="cellClass">
						<wd-text :text="prjDetailInfo.businesscon" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
					</wd-cell>
					<wd-cell title="创建者" :value="prjDetailInfo.username" custom-class="customCell" />
					<wd-cell title="创建时间" :value="prjDetailInfo.dbtime" custom-class="customCell" />
					<!-- <wd-cell title="注意事项" title-width="100px" :value="prjDetailInfo.precautions ? prjDetailInfo.precautions : '无'" custom-class="customCell" /> -->
				</view>
			</view>
		</view>

		<view v-if="activeTab === 1">
			<view v-if="prjDetailInfo.debugEquipmentList.length > 0" style="margin-bottom: 40rpx;">
				<uni-swipe-action>
					<uni-swipe-action-item v-for="(businessDeviceItem, businessDeviceIndex) in prjDetailInfo.debugEquipmentList" :key="businessDeviceIndex" :right-options="equipmentOptions" @click="handleDeleteDiffTypeChange(businessDeviceItem.id)">
						<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: businessDeviceIndex === 0 ? '0 20rpx 0' : businessDeviceIndex === dataForm.prjDebugEquipmentTotal - 1 ? (equipmentManageVisible ? '20rpx 20rpx 100rpx 20rpx' : '20rpx 20rpx 0 20rpx') : '20rpx 20rpx 0', borderRadius: '20rpx', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }">
							<view style="padding: 0 0 0 20rpx;" v-if="hasPermission('project:Equipment:update') && equipmentManageVisible">
								<wd-checkbox v-model="businessDeviceItem.checked"></wd-checkbox>
							</view>
							<view style="padding: 5rpx; width: calc(100% - 10rpx);">
								<wd-cell :title="businessDeviceItem.devname" custom-class="customCellDebugbusinessWrap" custom-title-class="cellLabelTitle" ellipsis center>
									<view style="display: flex; align-items: center; justify-content: flex-end; gap: 0 20rpx;">
										<wd-tag :type="businessDeviceItem.status === 3 || businessDeviceItem.status === 4 ? 'danger' : businessDeviceItem.status === 2 ? 'warning' : 'primary'" round>
											{{ businessDeviceItem.status === 0 ? '未清点' : businessDeviceItem.status === 1 ? '正常' : businessDeviceItem.status === 2 ? '增补' : businessDeviceItem.status === 3 ? '退货' : businessDeviceItem.status === 4 ? '换货' : '未清点' }}
										</wd-tag>
										<wd-icon v-if="hasPermission('project:Equipment:update')" name="edit-outline" size="18px" @click.stop="handleJumpChange(activeTab, '/projectPages/adddebugequipment/Index?pid=' + prjDetailInfo.id + '&id=' + businessDeviceItem.id)"></wd-icon>
									</view>
								</wd-cell>
								<view @click="handleJumpChange(2, '/projectPages/debugequipmentinfo/Index?id=' + businessDeviceItem.id)">
									<wd-cell title="型号" :value="businessDeviceItem.devmodel" custom-class="customCell" ellipsis></wd-cell>
									<wd-cell title="数量" :value="businessDeviceItem.devunit ? businessDeviceItem.devnum + businessDeviceItem.devunit : businessDeviceItem.devnum" custom-class="customCell" ellipsis></wd-cell>
									<wd-cell title="是否安装就位" custom-class="customCell" v-if="businessDeviceItem.hasOwnProperty('install')">
										<wd-tag :type="businessDeviceItem.install === 1 ? 'danger' : businessDeviceItem.install === 0 ? 'success' : 'default'" round>
											{{ businessDeviceItem.install === 0 ? '是' : businessDeviceItem.install === 1 ? '否' : '未知' }}
										</wd-tag>
									</wd-cell>
									<wd-cell title="接线方式" v-if="businessDeviceItem.hasOwnProperty('connectionmode')" :value="businessDeviceItem.connectionmode" custom-class="customCell" ellipsis></wd-cell>
									<wd-cell title="设备状态" custom-class="customCell" v-if="businessDeviceItem.hasOwnProperty('devstatus')">
										<wd-tag :type="businessDeviceItem.devstatus === 1 ? 'danger' : businessDeviceItem.devstatus === 0 ? 'success' : 'default'" round>
											{{ businessDeviceItem.devstatus === 0 ? '正常' : businessDeviceItem.devstatus === 1 ? '异常' : '未知' }}
										</wd-tag>
									</wd-cell>
									<wd-cell title="厂家联系人" v-if="businessDeviceItem.hasOwnProperty('manucontact')" :value="businessDeviceItem.manucontact" custom-class="customCell" ellipsis></wd-cell>
									<wd-cell title="厂家联系方式" v-if="businessDeviceItem.hasOwnProperty('manuinfo')" :value="businessDeviceItem.manuinfo" custom-class="customCell" ellipsis></wd-cell>
									<wd-cell title="清点人/时间" custom-class="customCell" ellipsis>
										<view style="display: flex; flex-direction: column; flex-wrap: wrap;">
											<view v-if="businessDeviceItem.dusername" style="display: flex; justify-content: flex-end; align-items: center; flex-wrap: wrap;">
												{{ businessDeviceItem.dusername }}
											</view>
											<view v-if="businessDeviceItem.ddbtime" style="display: flex; justify-content: flex-end; align-items: center; flex-wrap: wrap;">
												{{ businessDeviceItem.ddbtime }}
											</view>
										</view>
									</wd-cell>
									<wd-cell title="创建者/时间" :value="businessDeviceItem.username" custom-class="customCell" ellipsis>
										<view style="display: flex; flex-direction: column; flex-wrap: wrap;">
											<view v-if="businessDeviceItem.username" style="display: flex; justify-content: flex-end; align-items: center; flex-wrap: wrap;">
												{{ businessDeviceItem.username }}
											</view>
											<view v-if="businessDeviceItem.dbtime" style="display: flex; justify-content: flex-end; align-items: center; flex-wrap: wrap;">
												{{ businessDeviceItem.dbtime }}
											</view>
										</view>
									</wd-cell>
								</view>
							</view>
						</view>
					</uni-swipe-action-item>
				</uni-swipe-action>
				
				<view v-if="equipmentManageVisible" :style="{ width: 'calc(100vw - 40rpx)', padding: '20rpx', position: 'fixed', left: 0, bottom: 0, background: isDark ? '#000000' : '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: isDark ? '1rpx solid #cccccc' : 'none' }">
					<wd-checkbox v-model="checkedAllDevice" @change="handleCheckAllChange">全选</wd-checkbox>
					<view>
						<wd-button type="success" :loading="inventoryDeiceLoading" @click="handleInventoryDeiceChange">一键清点设备</wd-button>
					</view>
				</view>
			</view>

			<view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '0 20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
				<wd-status-tip image="../../static/search.png" tip="暂无调试设备" />
			</view>
		</view>

		<view v-if="activeTab === 2">
			<view v-if="prjDetailInfo.debugBussinessList.length > 0">
				<uni-swipe-action>
					<uni-swipe-action-item v-for="(businessItem, businessIndex) in prjDetailInfo.debugBussinessList" :key="businessIndex" :right-options="debugOptions" @click="handleDeleteDiffTypeChange(businessItem.id)">
						<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: businessIndex === 0 ? '0 20rpx 0' : businessIndex === dataForm.prjDebugBusinessTotal ? '20rpx 20rpx 40rpx 20rpx' : '20rpx 20rpx 0', borderRadius: '20rpx' }">
							<view style="padding: 5rpx;">
								<wd-cell :title="businessItem.debugname" custom-class="customCellDebugbusinessWrap" custom-title-class="cellLabelTitle" ellipsis center>
									<view style="display: flex; align-items: center; justify-content: flex-end; gap: 0 20rpx;">
										<wd-tag :type="businessItem.status === -1 ? 'warning' : businessItem.status === 0 ? 'default' : businessItem.status === 1 ? 'primary' : businessItem.status === 2 ? 'warning' : businessItem.status === 3 ? 'success' : 'default'" round>
											{{ businessItem.status === -1 ? '申请中' : businessItem.status === 0 ? '待调试' : businessItem.status === 1 ? '实施中' : businessItem.status === 2 ? '待审核' : businessItem.status === 3 ? '审核完成' : '未知' }}
										</wd-tag>
										<wd-icon v-if="hasPermission('project:Debug:update')" name="edit-outline" size="18px" @click.stop="handleJumpChange(activeTab, '/projectPages/adddebugbusiness/Index?pid=' + prjDetailInfo.id + '&id=' + businessItem.id)"></wd-icon>
									</view>
								</wd-cell>
								<view @click="handleJumpChange(1, '/projectPages/debugbussinessinfo/Index?id=' + businessItem.id)">
									<wd-cell title="类型名称" :value="businessItem.tname" custom-class="customCell" />
									<wd-cell v-if="businessItem.eqmname" title="调试设备" :value="businessItem.eqmname" custom-class="customCell" />
									<wd-cell title="调试工程师" :value="businessItem.dbusername" custom-class="customCell" />
									<wd-cell title="计划起止时间" :value="(businessItem.starttime || '--') + ' ~ ' + (businessItem.endtime || '--')" custom-class="customCell"></wd-cell>
									<wd-cell title="调试起止时间" v-if="businessItem.status > 0" :value="businessItem.dbdbtime + ' ~ ' + (businessItem.dedbtime || '--')" custom-class="customCell"></wd-cell>
									<wd-cell title="调试工时" v-if="businessItem.status - 1 > 0" :value="businessItem.duration + '小时'" custom-class="customCell" ellipsis></wd-cell>
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
									<wd-cell v-if="businessItem.status === 3" title="审核人/时间" :value="businessItem.ckusername" custom-class="customCell" ellipsis>
										<view style="display: flex; flex-direction: column; flex-wrap: wrap;">
											<view v-if="businessItem.ckusername" style="display: flex; justify-content: flex-end; align-items: center; flex-wrap: wrap;">
												{{ businessItem.ckusername }}
											</view>
											<view v-if="businessItem.ckdbtime" style="display: flex; justify-content: flex-end; align-items: center; flex-wrap: wrap;">
												{{ businessItem.ckdbtime }}
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
									<!-- <wd-cell title="对接方负责人" :value="businessItem.dockcharge" custom-class="customCell" ellipsis></wd-cell>
									<wd-cell title="联系方式" :value="businessItem.dockcontact" custom-class="customCell" ellipsis></wd-cell>
									<wd-cell title="备注" :value="businessItem.notes" custom-class="customCell" ellipsis></wd-cell>
									<wd-cell title="创建者" :value="businessItem.username" custom-class="customCell" ellipsis />
									<wd-cell title="创建时间" :value="businessItem.dbtime" custom-class="customCell" ellipsis /> -->
								</view>

								<wd-gap bg-color="#cccccc" height="2rpx" v-if="hasPermission('project:Debug:update') && (businessItem.status === -1 || businessItem.status === 0 || businessItem.status === 1 || businessItem.status === 2) && (userType === 0 || userType === 2 || userType === 3 || userType === 9)"></wd-gap>

								<view style="display: flex; justify-content: flex-end; margin-top: 10rpx; gap: 0 10rpx; padding-bottom: 10rpx;" v-if="hasPermission('project:Debug:update') && (businessItem.status === -1 || businessItem.status === 0 || businessItem.status === 1 || businessItem.status === 2) && (userType === 0 || userType === 2 || userType === 3 || userType === 9)">
									<wd-button v-if="hasPermission('project:Debug:update') && businessItem.status === -1 && (userType === 0 || userType === 2)" size="small" type="primary" @click.stop="handleUpdateStatusChange(businessItem, 0)">通过申请</wd-button>
									<wd-button v-if="hasPermission('project:Debug:update') && businessItem.status === 0 && (userType === 0 || userType === 2 || userType === 3 || userType === 9)" size="small" type="primary" @click.stop="handleUpdateStatusChange(businessItem, 1)">启动</wd-button>
									<wd-button v-if="hasPermission('project:Debug:update') && businessItem.status === 1 && (userType === 0 || userType === 2 || userType === 3 || userType === 9)" size="small" type="primary" @click.stop="handleUpdateStatusChange(businessItem, 2)">完成调试</wd-button>
									<wd-button v-if="hasPermission('project:Debug:update') && businessItem.status === 2 && (userType === 0 || userType === 2)" size="small" type="primary" @click.stop="handleUpdateStatusChange(businessItem, 3)">审核</wd-button>
								</view>
							</view>
						</view>
					</uni-swipe-action-item>
				</uni-swipe-action>
			</view>

			<view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '0 20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
				<wd-status-tip image="../../static/search.png" tip="暂无调试业务" />
			</view>
		</view>

		<view v-if="activeTab === 3">
			<view style="display: flex; justify-content: left; align-items: center; justify-content: space-between; flex-wrap: nowrap; padding: 10rpx 0 10rpx 10px; width: calc(100vw - 60rpx);">
				<view style="display: flex; align-items: center;">
					<view style="width: 5px; height: 15px; background: #0055FE;"></view>
					<view style="margin-left: 10rpx; font-weight: bolder;">项目图纸</view>
				</view>
				<view v-if="hasPermission('project:File:insert')">
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
								<wd-icon v-if="hasPermission('project:File:delete') && prjDetailInfo.status !== 3" name="delete-thin" size="22px" @click.stop="handleDeleteFileChange(projectDrawingsFileItem.url, projectDrawingsFileItem.id)"></wd-icon>
							</view>
						</view>
					</view>
				</view>
				<!-- <uni-swipe-action>
					<uni-swipe-action-item v-for="(projectDrawingsFileItem, projectDrawingsFileIndex) in projectDrawingsFileList" :key="projectDrawingsFileIndex" :right-options="options" @click="handleDeleteFileChange(projectDrawingsFileItem.url, projectDrawingsFileItem.id)">
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

								<view style="display: inline-block; width: 22px; margin-left: 18px;" @click.stop="downloadFile(projectDrawingsFileItem.url, null)">
									<wd-icon name="cloud-download" size="22px"></wd-icon>
								</view>
							</view>
						</view>
					</uni-swipe-action-item>
				</uni-swipe-action> -->
			</view>

			<view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
				<wd-status-tip :image-size="{ height: 80, width: 80 }" image="../../static/search.png" tip="暂无项目图纸" />
			</view>

			<view style="display: flex; justify-content: left; align-items: center; justify-content: space-between; flex-wrap: nowrap; padding: 10px 0 10rpx 10px; width: calc(100vw - 60rpx);">
				<view style="display: flex; align-items: center;">
					<view style="width: 5px; height: 15px; background: #0055FE;"></view>
					<view style="margin-left: 10rpx; font-weight: bolder;">项目文件</view>
				</view>
				<view v-if="hasPermission('project:File:insert')">
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
								<wd-icon v-if="hasPermission('project:File:delete') && prjDetailInfo.status !== 3" name="delete-thin" size="22px" @click.stop="handleDeleteFileChange(ipAddressItem.url, ipAddressItem.id)"></wd-icon>
							</view>
						</view>
					</view>
				</view>
				<!-- <uni-swipe-action>
					<uni-swipe-action-item v-for="(ipAddressItem, ipAddressIndex) in ipAddressList" :key="ipAddressIndex" :right-options="options" @click="handleDeleteFileChange(ipAddressItem.url, ipAddressItem.id)">
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

								<view style="display: inline-block; width: 22px; margin-left: 18px;" @click.stop="downloadFile(ipAddressItem.url, null)">
									<wd-icon name="cloud-download" size="22px"></wd-icon>
								</view>
							</view>
						</view>
					</uni-swipe-action-item>
				</uni-swipe-action> -->
			</view>

			<view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
				<wd-status-tip :image-size="{ height: 80, width: 80 }" image="../../static/search.png" tip="暂无项目文件" />
			</view>

			<view style="display: flex; justify-content: left; align-items: center; justify-content: space-between; flex-wrap: nowrap; padding: 10px 0 10rpx 10px; width: calc(100vw - 60rpx);">
				<view style="display: flex; align-items: center;">
					<view style="width: 5px; height: 15px; background: #0055FE;"></view>
					<view style="margin-left: 10rpx; font-weight: bolder;">工程文件压缩包</view>
				</view>
				<view v-if="hasPermission('project:File:insert')">
					<wd-icon name="cloud-upload" size="22px" @click="handleUploadFileSelectClickChange(3)"></wd-icon>
				</view>
			</view>

			<view v-if="projectFileList.length > 0" :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '0 20rpx 20rpx', borderRadius: '20rpx' }">
				<view v-for="(projectFileItem, projectFileIndex) in projectFileList" :key="projectFileIndex">
					<view style="padding: 20rpx;">
						<view class="prjInfoHeader">
							<view class="left">
								<wd-img :width="30" :height="30" :src="projectFileItem.url" v-if="isImageUrl(projectFileItem.url)" :preview-src="projectFileItem.url" :enable-preview="true" />
								<wd-img :width="30" :height="30" v-else :src="extIconMap[getExtensionFromUrl(projectFileItem.url)] === 0 ? 'https://dingiiot.com/fileImg/docx.png' : extIconMap[getExtensionFromUrl(projectFileItem.url)] === 1 ? 'https://dingiiot.com/fileImg/pdf.png' : extIconMap[getExtensionFromUrl(projectFileItem.url)] === 2 ? 'https://dingiiot.com/fileImg/xlsx.png': extIconMap[getExtensionFromUrl(projectFileItem.url)] === 3 ? 'https://dingiiot.com/fileImg/rar.png' : extIconMap[getExtensionFromUrl(projectFileItem.url)] === 4 ? 'https://dingiiot.com/fileImg/tar.png' : extIconMap[getExtensionFromUrl(projectFileItem.url)] === 5 ? 'https://dingiiot.com/fileImg/ppt.png' : 'https://dingiiot.com/fileImg/docx.png'" />
							</view>

							<view class="right" v-if="isSupportedFileType(projectFileItem.url)">
								<CjxPreviewOffice
									ref="previewOfficeRef"
									:value="projectFileItem.url"
									:name="projectFileItem.filename"
									:type="getFileType(projectFileItem.url)"
								>
									<span style="display: inline-block; word-wrap: break-word; width: calc(100vw - 240rpx);">{{ projectFileItem.filename }}</span>
								</CjxPreviewOffice>
								<view style="display: flex; justify-content: space-between; align-items: center; margin-top: 20rpx; width: calc(100vw - 120px);">
									<wd-text bold :text="projectFileItem.username" />
									<wd-text bold :text="projectFileItem.dbtime" />
								</view>
							</view>

							<view class="right" v-else @click="handlePreviewFileChange(projectFileItem.url)">
								<wd-text bold :text="projectFileItem.filename" size="15px" :color="isDark ? '#ffffff' : '#000000'" custom-style="word-wrap: break-word; width: calc(100vw - 240rpx);" />
								<view style="display: flex; justify-content: space-between; align-items: center; margin-top: 20rpx; width: calc(100vw - 120px);">
									<wd-text bold :text="projectFileItem.username" />
									<wd-text bold :text="projectFileItem.dbtime" />
								</view>
							</view>
							<view style="display: flex; flex-direction: column; gap: 10rpx; width: 22px; margin-left: 18px;">
								<wd-icon name="cloud-download" size="22px" @click.stop="downloadFile(projectFileItem.url, null)"></wd-icon>
								<wd-icon v-if="hasPermission('project:File:delete') && prjDetailInfo.status !== 3" name="delete-thin" size="22px" @click.stop="handleDeleteFileChange(projectFileItem.url, projectFileItem.id)"></wd-icon>
							</view>
						</view>
					</view>
				</view>
				<!-- <uni-swipe-action>
					<uni-swipe-action-item v-for="(projectFileItem, projectFileIndex) in projectFileList" :key="projectFileIndex" :right-options="options" @click="handleDeleteFileChange(projectFileItem.url, projectFileItem.id)">
						<view style="padding: 20rpx;">
							<view class="prjInfoHeader">
								<view class="left">
									<wd-img :width="30" :height="30" :src="projectFileItem.url" v-if="isImageUrl(projectFileItem.url)" :preview-src="projectFileItem.url" :enable-preview="true" />
									<wd-img :width="30" :height="30" v-else :src="extIconMap[getExtensionFromUrl(projectFileItem.url)] === 0 ? 'https://dingiiot.com/fileImg/docx.png' : extIconMap[getExtensionFromUrl(projectFileItem.url)] === 1 ? 'https://dingiiot.com/fileImg/pdf.png' : extIconMap[getExtensionFromUrl(projectFileItem.url)] === 2 ? 'https://dingiiot.com/fileImg/xlsx.png': extIconMap[getExtensionFromUrl(projectFileItem.url)] === 3 ? 'https://dingiiot.com/fileImg/rar.png' : extIconMap[getExtensionFromUrl(projectFileItem.url)] === 4 ? 'https://dingiiot.com/fileImg/tar.png' : extIconMap[getExtensionFromUrl(projectFileItem.url)] === 5 ? 'https://dingiiot.com/fileImg/ppt.png' : 'https://dingiiot.com/fileImg/docx.png'" />
								</view>

								<view class="right" v-if="isSupportedFileType(projectFileItem.url)">
									<CjxPreviewOffice
										ref="previewOfficeRef"
										:value="projectFileItem.url"
										:name="projectFileItem.filename"
										:type="getFileType(projectFileItem.url)"
									>
										<span style="display: inline-block; word-wrap: break-word; width: calc(100vw - 240rpx);">{{ projectFileItem.filename }}</span>
									</CjxPreviewOffice>
									<view style="display: flex; justify-content: space-between; align-items: center; margin-top: 20rpx; width: calc(100vw - 120px);">
										<wd-text bold :text="projectFileItem.username" />
										<wd-text bold :text="projectFileItem.dbtime" />
									</view>
								</view>

								<view class="right" v-else @click="handlePreviewFileChange(projectFileItem.url)">
									<wd-text bold :text="projectFileItem.filename" size="15px" :color="isDark ? '#ffffff' : '#000000'" custom-style="word-wrap: break-word; width: calc(100vw - 240rpx);" />
									<view style="display: flex; justify-content: space-between; align-items: center; margin-top: 20rpx; width: calc(100vw - 120px);">
										<wd-text bold :text="projectFileItem.username" />
										<wd-text bold :text="projectFileItem.dbtime" />
									</view>
								</view>
								<view style="display: inline-block; width: 22px; margin-left: 18px;" @click.stop="downloadFile(projectFileItem.url, null)">
									<wd-icon name="cloud-download" size="22px"></wd-icon>
								</view>
							</view>
						</view>
					</uni-swipe-action-item>
				</uni-swipe-action> -->
			</view>

			<view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
				<wd-status-tip :image-size="{ height: 80, width: 80 }" image="../../static/search.png" tip="暂无工程文件压缩包" />
			</view>

			<view style="display: flex; justify-content: left; align-items: center; justify-content: space-between; flex-wrap: nowrap; padding: 10px 0 10rpx 10px; width: calc(100vw - 60rpx);">
				<view style="display: flex; align-items: center;">
					<view style="width: 5px; height: 15px; background: #0055FE;"></view>
					<view style="margin-left: 10rpx; font-weight: bolder;">项目现场照片</view>
					<view style="color: #FFA502; font-size: 12px; margin-left: 5px;">照片数不少于6张</view>
				</view>
				<view v-if="hasPermission('project:File:insert')">
					<wd-icon name="cloud-upload" size="22px" @click="handleUploadFileSelectClickChange(4)"></wd-icon>
				</view>
			</view>

			<view v-if="fileList.length > 0" :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '0 20rpx 20rpx', borderRadius: '20rpx' }">
				<view v-for="(fileItem, fileIndex) in fileList" :key="fileIndex">
					<view style="padding: 20rpx;">
						<view class="prjInfoHeader">
							<view class="left">
								<wd-img :width="30" :height="30" :src="fileItem.url" v-if="isImageUrl(fileItem.url)" :preview-src="fileItem.url" :enable-preview="true" />
								<wd-img :width="30" :height="30" v-else :src="extIconMap[getExtensionFromUrl(fileItem.url)] === 0 ? 'https://dingiiot.com/fileImg/docx.png' : extIconMap[getExtensionFromUrl(fileItem.url)] === 1 ? 'https://dingiiot.com/fileImg/pdf.png' : extIconMap[getExtensionFromUrl(fileItem.url)] === 2 ? 'https://dingiiot.com/fileImg/xlsx.png': extIconMap[getExtensionFromUrl(fileItem.url)] === 3 ? 'https://dingiiot.com/fileImg/rar.png' : extIconMap[getExtensionFromUrl(fileItem.url)] === 4 ? 'https://dingiiot.com/fileImg/tar.png' : extIconMap[getExtensionFromUrl(fileItem.url)] === 5 ? 'https://dingiiot.com/fileImg/ppt.png' : 'https://dingiiot.com/fileImg/docx.png'" />
							</view>

							<view class="right" v-if="isSupportedFileType(fileItem.url)">
								<CjxPreviewOffice
									ref="previewOfficeRef"
									:value="fileItem.url"
									:name="fileItem.filename"
									:type="getFileType(fileItem.url)"
								>
									<span style="display: inline-block; word-wrap: break-word; width: calc(100vw - 240rpx);">{{ fileItem.filename }}</span>
								</CjxPreviewOffice>
								<view style="display: flex; justify-content: space-between; align-items: center; margin-top: 20rpx; width: calc(100vw - 120px);">
									<wd-text bold :text="fileItem.username" />
									<wd-text bold :text="fileItem.dbtime" />
								</view>
							</view>

							<view class="right" v-else @click="handlePreviewFileChange(fileItem.url)">
								<wd-text bold :text="fileItem.filename" size="15px" :color="isDark ? '#ffffff' : '#000000'" custom-style="word-wrap: break-word; width: calc(100vw - 240rpx);" />
								<view style="display: flex; justify-content: space-between; align-items: center; margin-top: 20rpx; width: calc(100vw - 120px);">
									<wd-text bold :text="fileItem.username" />
									<wd-text bold :text="fileItem.dbtime" />
								</view>
							</view>
							<view style="display: inline-block; width: 22px; margin-left: 18px;">
								<wd-icon name="cloud-download" size="22px" @click.stop="downloadFile(fileItem.url, null)"></wd-icon>
								<wd-icon v-if="hasPermission('project:File:delete') && prjDetailInfo.status !== 3" name="delete-thin" size="22px" @click.stop="handleDeleteFileChange(fileItem.url, fileItem.id)"></wd-icon>
							</view>
						</view>
					</view>
				</view>
				<!-- <uni-swipe-action>
					<uni-swipe-action-item v-for="(fileItem, fileIndex) in fileList" :key="fileIndex" :right-options="options" @click="handleDeleteFileChange(fileItem.url, fileItem.id)">
						<view style="padding: 20rpx;">
							<view class="prjInfoHeader">
								<view class="left">
									<wd-img :width="30" :height="30" :src="fileItem.url" v-if="isImageUrl(fileItem.url)" :preview-src="fileItem.url" :enable-preview="true" />
									<wd-img :width="30" :height="30" v-else :src="extIconMap[getExtensionFromUrl(fileItem.url)] === 0 ? 'https://dingiiot.com/fileImg/docx.png' : extIconMap[getExtensionFromUrl(fileItem.url)] === 1 ? 'https://dingiiot.com/fileImg/pdf.png' : extIconMap[getExtensionFromUrl(fileItem.url)] === 2 ? 'https://dingiiot.com/fileImg/xlsx.png': extIconMap[getExtensionFromUrl(fileItem.url)] === 3 ? 'https://dingiiot.com/fileImg/rar.png' : extIconMap[getExtensionFromUrl(fileItem.url)] === 4 ? 'https://dingiiot.com/fileImg/tar.png' : extIconMap[getExtensionFromUrl(fileItem.url)] === 5 ? 'https://dingiiot.com/fileImg/ppt.png' : 'https://dingiiot.com/fileImg/docx.png'" />
								</view>

								<view class="right" v-if="isSupportedFileType(fileItem.url)">
									<CjxPreviewOffice
										ref="previewOfficeRef"
										:value="fileItem.url"
										:name="fileItem.filename"
										:type="getFileType(fileItem.url)"
									>
										<span style="display: inline-block; word-wrap: break-word; width: calc(100vw - 240rpx);">{{ fileItem.filename }}</span>
									</CjxPreviewOffice>
									<view style="display: flex; justify-content: space-between; align-items: center; margin-top: 20rpx; width: calc(100vw - 120px);">
										<wd-text bold :text="fileItem.username" />
										<wd-text bold :text="fileItem.dbtime" />
									</view>
								</view>

								<view class="right" v-else @click="handlePreviewFileChange(fileItem.url)">
									<wd-text bold :text="fileItem.filename" size="15px" :color="isDark ? '#ffffff' : '#000000'" custom-style="word-wrap: break-word; width: calc(100vw - 240rpx);" />
									<view style="display: flex; justify-content: space-between; align-items: center; margin-top: 20rpx; width: calc(100vw - 120px);">
										<wd-text bold :text="fileItem.username" />
										<wd-text bold :text="fileItem.dbtime" />
									</view>
								</view>
								<view style="display: inline-block; width: 22px; margin-left: 18px;" @click.stop="downloadFile(fileItem.url, null)">
									<wd-icon name="cloud-download" size="22px"></wd-icon>
								</view>
							</view>
						</view>
					</uni-swipe-action-item>
				</uni-swipe-action> -->
			</view>

			<view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
				<wd-status-tip :image-size="{ height: 80, width: 80 }" image="../../static/search.png" tip="暂无项目现场照片" />
			</view>

			<view style="display: flex; justify-content: left; align-items: center; justify-content: space-between; flex-wrap: nowrap; padding: 10px 0 10rpx 10px; width: calc(100vw - 60rpx);">
				<view style="display: flex; align-items: center;">
					<view style="width: 5px; height: 15px; background: #0055FE;"></view>
					<view style="margin-left: 10rpx; font-weight: bolder;">网络通讯简图</view>
				</view>
				<view v-if="hasPermission('project:File:insert')">
					<wd-icon name="cloud-upload" size="22px" @click="handleUploadFileSelectClickChange(5)"></wd-icon>
				</view>
			</view>

			<view v-if="networkCommunicationDiagramFileList.length > 0" :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '0 20rpx 20rpx', borderRadius: '20rpx' }">
				<view v-for="(networkCommunicationDiagramFileItem, networkCommunicationDiagramFileListIndex) in networkCommunicationDiagramFileList" :key="networkCommunicationDiagramFileListIndex">
					<view style="padding: 20rpx;">
						<view class="prjInfoHeader">
							<view class="left">
								<wd-img :width="30" :height="30" :src="networkCommunicationDiagramFileItem.url" v-if="isImageUrl(networkCommunicationDiagramFileItem.url)" :preview-src="networkCommunicationDiagramFileItem.url" :enable-preview="true" />
								<wd-img :width="30" :height="30" v-else :src="extIconMap[getExtensionFromUrl(networkCommunicationDiagramFileItem.url)] === 0 ? 'https://dingiiot.com/fileImg/docx.png' : extIconMap[getExtensionFromUrl(networkCommunicationDiagramFileItem.url)] === 1 ? 'https://dingiiot.com/fileImg/pdf.png' : extIconMap[getExtensionFromUrl(networkCommunicationDiagramFileItem.url)] === 2 ? 'https://dingiiot.com/fileImg/xlsx.png': extIconMap[getExtensionFromUrl(networkCommunicationDiagramFileItem.url)] === 3 ? 'https://dingiiot.com/fileImg/rar.png' : extIconMap[getExtensionFromUrl(networkCommunicationDiagramFileItem.url)] === 4 ? 'https://dingiiot.com/fileImg/tar.png' : extIconMap[getExtensionFromUrl(networkCommunicationDiagramFileItem.url)] === 5 ? 'https://dingiiot.com/fileImg/ppt.png' : 'https://dingiiot.com/fileImg/docx.png'" />
							</view>

							<view class="right" v-if="isSupportedFileType(networkCommunicationDiagramFileItem.url)">
								<CjxPreviewOffice
									ref="previewOfficeRef"
									:value="networkCommunicationDiagramFileItem.url"
									:name="networkCommunicationDiagramFileItem.filename"
									:type="getFileType(networkCommunicationDiagramFileItem.url)"
								>
									<span style="display: inline-block; word-wrap: break-word; width: calc(100vw - 240rpx);">{{ networkCommunicationDiagramFileItem.filename }}</span>
								</CjxPreviewOffice>
								<view style="display: flex; justify-content: space-between; align-items: center; margin-top: 20rpx; width: calc(100vw - 120px);">
									<wd-text bold :text="networkCommunicationDiagramFileItem.username" />
									<wd-text bold :text="networkCommunicationDiagramFileItem.dbtime" />
								</view>
							</view>

							<view class="right" v-else @click="handlePreviewFileChange(networkCommunicationDiagramFileItem.url)">
								<wd-text bold :text="networkCommunicationDiagramFileItem.filename" size="15px" :color="isDark ? '#ffffff' : '#000000'" custom-style="word-wrap: break-word; width: calc(100vw - 240rpx);" />
								<view style="display: flex; justify-content: space-between; align-items: center; margin-top: 20rpx; width: calc(100vw - 120px);">
									<wd-text bold :text="networkCommunicationDiagramFileItem.username" />
									<wd-text bold :text="networkCommunicationDiagramFileItem.dbtime" />
								</view>
							</view>

							<view style="display: flex; flex-direction: column; gap: 10rpx; width: 22px; margin-left: 18px;">
								<wd-icon name="cloud-download" size="22px" @click.stop="downloadFile(networkCommunicationDiagramFileItem.url, null)"></wd-icon>
								<wd-icon v-if="prjDetailInfo.status !== 3" name="delete-thin" size="22px" @click.stop="handleDeleteFileChange(networkCommunicationDiagramFileItem.url, networkCommunicationDiagramFileItem.id)"></wd-icon>
							</view>
						</view>
					</view>
				</view>
				<!-- <uni-swipe-action>
					<uni-swipe-action-item v-for="(networkCommunicationDiagramFileItem, networkCommunicationDiagramFileListIndex) in networkCommunicationDiagramFileList" :key="networkCommunicationDiagramFileListIndex" :right-options="options" @click="handleDeleteFileChange(networkCommunicationDiagramFileItem.url, networkCommunicationDiagramFileItem.id)">
						<view style="padding: 20rpx;">
							<view class="prjInfoHeader">
								<view class="left">
									<wd-img :width="30" :height="30" :src="networkCommunicationDiagramFileItem.url" v-if="isImageUrl(networkCommunicationDiagramFileItem.url)" :preview-src="networkCommunicationDiagramFileItem.url" :enable-preview="true" />
									<wd-img :width="30" :height="30" v-else :src="extIconMap[getExtensionFromUrl(networkCommunicationDiagramFileItem.url)] === 0 ? 'https://dingiiot.com/fileImg/docx.png' : extIconMap[getExtensionFromUrl(networkCommunicationDiagramFileItem.url)] === 1 ? 'https://dingiiot.com/fileImg/pdf.png' : extIconMap[getExtensionFromUrl(networkCommunicationDiagramFileItem.url)] === 2 ? 'https://dingiiot.com/fileImg/xlsx.png': extIconMap[getExtensionFromUrl(networkCommunicationDiagramFileItem.url)] === 3 ? 'https://dingiiot.com/fileImg/rar.png' : extIconMap[getExtensionFromUrl(networkCommunicationDiagramFileItem.url)] === 4 ? 'https://dingiiot.com/fileImg/tar.png' : extIconMap[getExtensionFromUrl(networkCommunicationDiagramFileItem.url)] === 5 ? 'https://dingiiot.com/fileImg/ppt.png' : 'https://dingiiot.com/fileImg/docx.png'" />
								</view>

								<view class="right" v-if="isSupportedFileType(networkCommunicationDiagramFileItem.url)">
									<CjxPreviewOffice
										ref="previewOfficeRef"
										:value="networkCommunicationDiagramFileItem.url"
										:name="networkCommunicationDiagramFileItem.filename"
										:type="getFileType(networkCommunicationDiagramFileItem.url)"
									>
										<span style="display: inline-block; word-wrap: break-word; width: calc(100vw - 240rpx);">{{ networkCommunicationDiagramFileItem.filename }}</span>
									</CjxPreviewOffice>
									<view style="display: flex; justify-content: space-between; align-items: center; margin-top: 20rpx; width: calc(100vw - 120px);">
										<wd-text bold :text="networkCommunicationDiagramFileItem.username" />
										<wd-text bold :text="networkCommunicationDiagramFileItem.dbtime" />
									</view>
								</view>

								<view class="right" v-else @click="handlePreviewFileChange(networkCommunicationDiagramFileItem.url)">
									<wd-text bold :text="networkCommunicationDiagramFileItem.filename" size="15px" :color="isDark ? '#ffffff' : '#000000'" custom-style="word-wrap: break-word; width: calc(100vw - 240rpx);" />
									<view style="display: flex; justify-content: space-between; align-items: center; margin-top: 20rpx; width: calc(100vw - 120px);">
										<wd-text bold :text="networkCommunicationDiagramFileItem.username" />
										<wd-text bold :text="networkCommunicationDiagramFileItem.dbtime" />
									</view>
								</view>

								<view style="display: inline-block; width: 22px; margin-left: 18px;" @click.stop="downloadFile(networkCommunicationDiagramFileItem.url, null)">
									<wd-icon name="cloud-download" size="22px"></wd-icon>
								</view>
							</view>
						</view>
					</uni-swipe-action-item>
				</uni-swipe-action> -->
			</view>

			<view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
				<wd-status-tip :image-size="{ height: 80, width: 80 }" image="../../static/search.png" tip="暂无网络通讯简图" />
			</view>

			<view style="display: flex; justify-content: left; align-items: center; justify-content: space-between; flex-wrap: nowrap; padding: 10px 0 10rpx 10px; width: calc(100vw - 60rpx);">
				<view style="display: flex; align-items: center;">
					<view style="width: 5px; height: 15px; background: #0055FE;"></view>
					<view style="margin-left: 10rpx; font-weight: bolder;">组态画面工程备份</view>
				</view>
				<view v-if="hasPermission('project:File:insert')">
					<wd-icon name="cloud-upload" size="22px" @click="handleUploadFileSelectClickChange(6)"></wd-icon>
				</view>
			</view>

			<view v-if="configurationProjectBackupFileList.length > 0" :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '0 20rpx 20rpx', borderRadius: '20rpx' }">
				<view v-for="(configurationProjectBackupFileItem, configurationProjectBackupFileIndex) in configurationProjectBackupFileList" :key="configurationProjectBackupFileIndex">
					<view style="padding: 20rpx;">
						<view class="prjInfoHeader">
							<view class="left">
								<wd-img :width="30" :height="30" :src="configurationProjectBackupFileItem.url" v-if="isImageUrl(configurationProjectBackupFileItem.url)" :preview-src="configurationProjectBackupFileItem.url" :enable-preview="true" />
								<wd-img :width="30" :height="30" v-else :src="extIconMap[getExtensionFromUrl(configurationProjectBackupFileItem.url)] === 0 ? 'https://dingiiot.com/fileImg/docx.png' : extIconMap[getExtensionFromUrl(configurationProjectBackupFileItem.url)] === 1 ? 'https://dingiiot.com/fileImg/pdf.png' : extIconMap[getExtensionFromUrl(configurationProjectBackupFileItem.url)] === 2 ? 'https://dingiiot.com/fileImg/xlsx.png': extIconMap[getExtensionFromUrl(configurationProjectBackupFileItem.url)] === 3 ? 'https://dingiiot.com/fileImg/rar.png' : extIconMap[getExtensionFromUrl(configurationProjectBackupFileItem.url)] === 4 ? 'https://dingiiot.com/fileImg/tar.png' : extIconMap[getExtensionFromUrl(configurationProjectBackupFileItem.url)] === 5 ? 'https://dingiiot.com/fileImg/ppt.png' : 'https://dingiiot.com/fileImg/docx.png'" />
							</view>

							<view class="right" v-if="isSupportedFileType(configurationProjectBackupFileItem.url)">
								<CjxPreviewOffice
									ref="previewOfficeRef"
									:value="configurationProjectBackupFileItem.url"
									:name="configurationProjectBackupFileItem.filename"
									:type="getFileType(configurationProjectBackupFileItem.url)"
								>
									<span style="display: inline-block; word-wrap: break-word; width: calc(100vw - 240rpx);">{{ configurationProjectBackupFileItem.filename }}</span>
								</CjxPreviewOffice>
								<view style="display: flex; justify-content: space-between; align-items: center; margin-top: 20rpx; width: calc(100vw - 120px);">
									<wd-text bold :text="configurationProjectBackupFileItem.username" />
									<wd-text bold :text="configurationProjectBackupFileItem.dbtime" />
								</view>
							</view>

							<view class="right" v-else @click="handlePreviewFileChange(configurationProjectBackupFileItem.url)">
								<wd-text bold :text="configurationProjectBackupFileItem.filename" size="15px" :color="isDark ? '#ffffff' : '#000000'" custom-style="word-wrap: break-word; width: calc(100vw - 240rpx);" />
								<view style="display: flex; justify-content: space-between; align-items: center; margin-top: 20rpx; width: calc(100vw - 120px);">
									<wd-text bold :text="configurationProjectBackupFileItem.username" />
									<wd-text bold :text="configurationProjectBackupFileItem.dbtime" />
								</view>
							</view>

							<view style="display: flex; flex-direction: column; gap: 10rpx; width: 22px; margin-left: 18px;">
								<wd-icon name="cloud-download" size="22px" @click.stop="downloadFile(configurationProjectBackupFileItem.url, null)"></wd-icon>
								<wd-icon v-if="hasPermission('project:File:delete') && prjDetailInfo.status !== 3" name="delete-thin" size="22px" @click.stop="handleDeleteFileChange(configurationProjectBackupFileItem.url, configurationProjectBackupFileItem.id)"></wd-icon>
							</view>
						</view>
					</view>
				</view>

				<!-- <uni-swipe-action>
					<uni-swipe-action-item v-for="(configurationProjectBackupFileItem, configurationProjectBackupFileIndex) in configurationProjectBackupFileList" :key="configurationProjectBackupFileIndex" :right-options="options" @click="handleDeleteFileChange(configurationProjectBackupFileItem.url, configurationProjectBackupFileItem.id)">
						<view style="padding: 20rpx;">
							<view class="prjInfoHeader">
								<view class="left">
									<wd-img :width="30" :height="30" :src="configurationProjectBackupFileItem.url" v-if="isImageUrl(configurationProjectBackupFileItem.url)" :preview-src="configurationProjectBackupFileItem.url" :enable-preview="true" />
									<wd-img :width="30" :height="30" v-else :src="extIconMap[getExtensionFromUrl(configurationProjectBackupFileItem.url)] === 0 ? 'https://dingiiot.com/fileImg/docx.png' : extIconMap[getExtensionFromUrl(configurationProjectBackupFileItem.url)] === 1 ? 'https://dingiiot.com/fileImg/pdf.png' : extIconMap[getExtensionFromUrl(configurationProjectBackupFileItem.url)] === 2 ? 'https://dingiiot.com/fileImg/xlsx.png': extIconMap[getExtensionFromUrl(configurationProjectBackupFileItem.url)] === 3 ? 'https://dingiiot.com/fileImg/rar.png' : extIconMap[getExtensionFromUrl(configurationProjectBackupFileItem.url)] === 4 ? 'https://dingiiot.com/fileImg/tar.png' : extIconMap[getExtensionFromUrl(configurationProjectBackupFileItem.url)] === 5 ? 'https://dingiiot.com/fileImg/ppt.png' : 'https://dingiiot.com/fileImg/docx.png'" />
								</view>

								<view class="right" v-if="isSupportedFileType(configurationProjectBackupFileItem.url)">
									<CjxPreviewOffice
										ref="previewOfficeRef"
										:value="configurationProjectBackupFileItem.url"
										:name="configurationProjectBackupFileItem.filename"
										:type="getFileType(configurationProjectBackupFileItem.url)"
									>
										<span style="display: inline-block; word-wrap: break-word; width: calc(100vw - 240rpx);">{{ configurationProjectBackupFileItem.filename }}</span>
									</CjxPreviewOffice>
									<view style="display: flex; justify-content: space-between; align-items: center; margin-top: 20rpx; width: calc(100vw - 120px);">
										<wd-text bold :text="configurationProjectBackupFileItem.username" />
										<wd-text bold :text="configurationProjectBackupFileItem.dbtime" />
									</view>
								</view>

								<view class="right" v-else @click="handlePreviewFileChange(configurationProjectBackupFileItem.url)">
									<wd-text bold :text="configurationProjectBackupFileItem.filename" size="15px" :color="isDark ? '#ffffff' : '#000000'" custom-style="word-wrap: break-word; width: calc(100vw - 240rpx);" />
									<view style="display: flex; justify-content: space-between; align-items: center; margin-top: 20rpx; width: calc(100vw - 120px);">
										<wd-text bold :text="configurationProjectBackupFileItem.username" />
										<wd-text bold :text="configurationProjectBackupFileItem.dbtime" />
									</view>
								</view>

								<view style="display: inline-block; width: 22px; margin-left: 18px;" @click.stop="downloadFile(configurationProjectBackupFileItem.url, null)">
									<wd-icon name="cloud-download" size="22px"></wd-icon>
								</view>
							</view>
						</view>
					</uni-swipe-action-item>
				</uni-swipe-action> -->
			</view>

			<view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
				<wd-status-tip :image-size="{ height: 80, width: 80 }" image="../../static/search.png" tip="暂无组态画面工程备份" />
			</view>

			<view style="display: flex; justify-content: left; align-items: center; justify-content: space-between; flex-wrap: nowrap; padding: 10px 0 10rpx 10px; width: calc(100vw - 60rpx);">
				<view style="display: flex; align-items: center;">
					<view style="width: 5px; height: 15px; background: #0055FE;"></view>
					<view style="margin-left: 10rpx; font-weight: bolder;">验收确认单拍照照片</view>
				</view>
				<view v-if="hasPermission('project:File:insert')">
					<wd-icon name="cloud-upload" size="22px" @click="handleUploadFileSelectClickChange(7)"></wd-icon>
				</view>
			</view>

			<view v-if="acceptanceConfirmationFileList.length > 0" :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '0 20rpx 20rpx', borderRadius: '20rpx' }">
				<view v-for="(acceptanceConfirmationFileItem, acceptanceConfirmationFileIndex) in acceptanceConfirmationFileList" :key="acceptanceConfirmationFileIndex">
					<view style="padding: 20rpx;">
						<view class="prjInfoHeader">
							<view class="left">
								<wd-img :width="30" :height="30" :src="acceptanceConfirmationFileItem.url" v-if="isImageUrl(acceptanceConfirmationFileItem.url)" :preview-src="acceptanceConfirmationFileItem.url" :enable-preview="true" />
								<wd-img :width="30" :height="30" v-else :src="extIconMap[getExtensionFromUrl(acceptanceConfirmationFileItem.url)] === 0 ? 'https://dingiiot.com/fileImg/docx.png' : extIconMap[getExtensionFromUrl(acceptanceConfirmationFileItem.url)] === 1 ? 'https://dingiiot.com/fileImg/pdf.png' : extIconMap[getExtensionFromUrl(acceptanceConfirmationFileItem.url)] === 2 ? 'https://dingiiot.com/fileImg/xlsx.png': extIconMap[getExtensionFromUrl(acceptanceConfirmationFileItem.url)] === 3 ? 'https://dingiiot.com/fileImg/rar.png' : extIconMap[getExtensionFromUrl(acceptanceConfirmationFileItem.url)] === 4 ? 'https://dingiiot.com/fileImg/tar.png' : extIconMap[getExtensionFromUrl(acceptanceConfirmationFileItem.url)] === 5 ? 'https://dingiiot.com/fileImg/ppt.png' : 'https://dingiiot.com/fileImg/docx.png'" />
							</view>

							<view class="right" v-if="isSupportedFileType(acceptanceConfirmationFileItem.url)">
								<CjxPreviewOffice
									ref="previewOfficeRef"
									:value="acceptanceConfirmationFileItem.url"
									:name="acceptanceConfirmationFileItem.filename"
									:type="getFileType(acceptanceConfirmationFileItem.url)"
								>
									<span style="display: inline-block; word-wrap: break-word; width: calc(100vw - 240rpx);">{{ acceptanceConfirmationFileItem.filename }}</span>
								</CjxPreviewOffice>
								<view style="display: flex; justify-content: space-between; align-items: center; margin-top: 20rpx; width: calc(100vw - 120px);">
									<wd-text bold :text="acceptanceConfirmationFileItem.username" />
									<wd-text bold :text="acceptanceConfirmationFileItem.dbtime" />
								</view>
							</view>

							<view class="right" v-else @click="handlePreviewFileChange(acceptanceConfirmationFileItem.url)">
								<wd-text bold :text="acceptanceConfirmationFileItem.filename" size="15px" :color="isDark ? '#ffffff' : '#000000'" custom-style="word-wrap: break-word; width: calc(100vw - 240rpx);" />
								<view style="display: flex; justify-content: space-between; align-items: center; margin-top: 20rpx; width: calc(100vw - 120px);">
									<wd-text bold :text="acceptanceConfirmationFileItem.username" />
									<wd-text bold :text="acceptanceConfirmationFileItem.dbtime" />
								</view>
							</view>

							<view style="display: flex; flex-direction: column; gap: 10rpx; width: 22px; margin-left: 18px;">
								<wd-icon name="cloud-download" size="22px" @click.stop="downloadFile(acceptanceConfirmationFileItem.url, null)"></wd-icon>
								<wd-icon v-if="hasPermission('project:File:delete') && prjDetailInfo.status !== 3" name="delete-thin" size="22px" @click.stop="handleDeleteFileChange(acceptanceConfirmationFileItem.url, acceptanceConfirmationFileItem.id)"></wd-icon>
							</view>
						</view>
					</view>
				</view>
				<!-- <uni-swipe-action>
					<uni-swipe-action-item v-for="(acceptanceConfirmationFileItem, acceptanceConfirmationFileIndex) in acceptanceConfirmationFileList" :key="acceptanceConfirmationFileIndex" :right-options="options" @click="handleDeleteFileChange(acceptanceConfirmationFileItem.url, acceptanceConfirmationFileItem.id)">
						<view style="padding: 20rpx;">
							<view class="prjInfoHeader">
								<view class="left">
									<wd-img :width="30" :height="30" :src="acceptanceConfirmationFileItem.url" v-if="isImageUrl(acceptanceConfirmationFileItem.url)" :preview-src="acceptanceConfirmationFileItem.url" :enable-preview="true" />
									<wd-img :width="30" :height="30" v-else :src="extIconMap[getExtensionFromUrl(acceptanceConfirmationFileItem.url)] === 0 ? 'https://dingiiot.com/fileImg/docx.png' : extIconMap[getExtensionFromUrl(acceptanceConfirmationFileItem.url)] === 1 ? 'https://dingiiot.com/fileImg/pdf.png' : extIconMap[getExtensionFromUrl(acceptanceConfirmationFileItem.url)] === 2 ? 'https://dingiiot.com/fileImg/xlsx.png': extIconMap[getExtensionFromUrl(acceptanceConfirmationFileItem.url)] === 3 ? 'https://dingiiot.com/fileImg/rar.png' : extIconMap[getExtensionFromUrl(acceptanceConfirmationFileItem.url)] === 4 ? 'https://dingiiot.com/fileImg/tar.png' : extIconMap[getExtensionFromUrl(acceptanceConfirmationFileItem.url)] === 5 ? 'https://dingiiot.com/fileImg/ppt.png' : 'https://dingiiot.com/fileImg/docx.png'" />
								</view>

								<view class="right" v-if="isSupportedFileType(acceptanceConfirmationFileItem.url)">
									<CjxPreviewOffice
										ref="previewOfficeRef"
										:value="acceptanceConfirmationFileItem.url"
										:name="acceptanceConfirmationFileItem.filename"
										:type="getFileType(acceptanceConfirmationFileItem.url)"
									>
										<span style="display: inline-block; word-wrap: break-word; width: calc(100vw - 240rpx);">{{ acceptanceConfirmationFileItem.filename }}</span>
									</CjxPreviewOffice>
									<view style="display: flex; justify-content: space-between; align-items: center; margin-top: 20rpx; width: calc(100vw - 120px);">
										<wd-text bold :text="acceptanceConfirmationFileItem.username" />
										<wd-text bold :text="acceptanceConfirmationFileItem.dbtime" />
									</view>
								</view>

								<view class="right" v-else @click="handlePreviewFileChange(acceptanceConfirmationFileItem.url)">
									<wd-text bold :text="acceptanceConfirmationFileItem.filename" size="15px" :color="isDark ? '#ffffff' : '#000000'" custom-style="word-wrap: break-word; width: calc(100vw - 240rpx);" />
									<view style="display: flex; justify-content: space-between; align-items: center; margin-top: 20rpx; width: calc(100vw - 120px);">
										<wd-text bold :text="acceptanceConfirmationFileItem.username" />
										<wd-text bold :text="acceptanceConfirmationFileItem.dbtime" />
									</view>
								</view>
								<view style="display: inline-block; width: 22px; margin-left: 18px;" @click.stop="downloadFile(acceptanceConfirmationFileItem.url, null)">
									<wd-icon name="cloud-download" size="22px"></wd-icon>
								</view>
							</view>
						</view>
					</uni-swipe-action-item>
				</uni-swipe-action> -->
			</view>

			<view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
				<wd-status-tip :image-size="{ height: 80, width: 80 }" image="../../static/search.png" tip="暂无验收确认单拍照照片" />
			</view>

			<view style="margin: 40rpx 20rpx; width: calc(100vw - 40rpx);" v-if="hasPermission('project:Info:update') && (userType === 0 || userType === 2) && prjDetailInfo.status === 2">
				<wd-button block type="primary" @click.stop="handleCheckPrjChange(prjDetailInfo.id, 3)">审核</wd-button>
			</view>

			<!-- <view v-if="acceptanceConfirmationFileList.length > 0"  :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 80rpx)', margin: '0 20rpx 20rpx', padding: '20rpx 20rpx 0 20rpx' }">
				<wd-upload :file-list="acceptanceConfirmationFileList" :limit="acceptanceConfirmationFileList.length" disabled></wd-upload>
			</view> -->
		</view>

		<view v-if="activeTab === 4">
			<view v-if="prjDetailInfo.memberDataList.length > 0">
				<uni-swipe-action>
					<uni-swipe-action-item v-for="(memberItem, memberIndex) in prjDetailInfo.memberDataList" :key="memberIndex" :right-options="contactOptions" @click="handleDeleteDiffTypeChange(memberItem.id)">
						<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: memberIndex === 0 ? '0 20rpx 0' : memberIndex === dataForm.prjMemberTotal ? '20rpx 20rpx 40rpx 20rpx' : '20rpx 20rpx 0', borderRadius: '20rpx' }">
							<view style="padding: 5rpx;">
								<wd-cell :title="memberItem.pname" custom-class="customCellContractWrap" custom-title-class="cellLabelTitle" ellipsis center>
									<wd-icon v-if="hasPermission('project:Contact:update')" name="edit-outline" size="18px" @click.stop="handleJumpChange(activeTab, '/projectPages/addprjmember/Index?pid=' + prjDetailInfo.id + '&id=' + memberItem.id)"></wd-icon>
								</wd-cell>
								<view>
									<wd-cell title="对接人" :value="memberItem.docker" custom-class="customCell"></wd-cell>
									<wd-cell title="联系方式" :value="memberItem.pcontact" custom-class="customCell">
										<view v-if="memberItem.pcontact" @click.stop="handleMakePhoneNumber(memberItem.pcontact)">
											<wd-text :text="memberItem.pcontact" type="warning" decoration="underline" />
										</view>
									</wd-cell>
									<wd-cell title="备注" :value="memberItem.proposition || '--'" custom-class="customCell"></wd-cell>
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
				<wd-status-tip image="../../static/search.png" tip="暂无项目联系人" />
			</view>
		</view>

		<!-- <view v-if="activeTab === 5">
			<view v-if="prjDetailInfo.contractDataList.length > 0">
				<view v-for="(contractItem, contractIndex) in prjDetailInfo.contractDataList" :key="contractIndex" @longpress="handleDeleteDiffTypeChange(contractItem.id)">
					<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: contractIndex === 0 ? '0 20rpx 20rpx 20rpx' : '20rpx', borderRadius: '20rpx' }">
						<view style="padding: 5rpx;">
							<wd-cell :title="contractItem.contractname" custom-class="customCellContractWrap" custom-title-class="cellCustomLabelTitle" ellipsis center>
								<wd-icon v-if="hasPermission('project:Contract:update')" name="edit-outline" size="18px" @click.stop="handleJumpChange(activeTab, '/projectPages/addcontract/Index?pid=' + prjDetailInfo.id + '&id=' + contractItem.id)"></wd-icon>
							</wd-cell>
							<view @click="handleJumpChange(activeTab, '/projectPages/contractdetail/Index?id=' + contractItem.id)">
								<wd-cell title="合同编号" icon="list" custom-class="cellClass">
									<wd-text bold :text="contractItem.contractnum" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
								</wd-cell>

								<wd-cell title="商务联系人" icon="user" custom-class="cellClass">
									<wd-text bold :text="contractItem.businesscon" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
									<view v-if="contractItem.businessinfo" @click.stop="handleMakePhoneNumber(contractItem.businessinfo)">
										<wd-text :text="' ' + contractItem.businessinfo" type="warning" decoration="underline" />
									</view>
								</wd-cell>
								<wd-cell title="创建者/时间" :value="contractItem.username" custom-class="customCell" ellipsis>
									<view style="display: flex; flex-direction: column; flex-wrap: wrap;">
										<view v-if="contractItem.username" style="display: flex; justify-content: flex-end; align-items: center; flex-wrap: wrap;">
											{{ contractItem.username }}
										</view>
										<view v-if="contractItem.dbtime" style="display: flex; justify-content: flex-end; align-items: center; flex-wrap: wrap;">
											{{ contractItem.dbtime }}
										</view>
									</view>
								</wd-cell>
							</view>
						</view>
					</view>
				</view>
			</view>

			<view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', height: 'calc(100vh - 380rpx)', margin: '0 20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
				<wd-status-tip image="../../static/search.png" tip="暂无项目合同" />
			</view>
		</view> -->

		<view v-if="activeTab === 5">
			<view v-if="prjDetailInfo.requirementsChangeList.length > 0">
				<uni-swipe-action>
					<uni-swipe-action-item v-for="(requirementsChangeItem, requirementsChangeIndex) in prjDetailInfo.requirementsChangeList" :key="requirementsChangeIndex" :right-options="customerOptions" @click="handleDeleteDiffTypeChange(requirementsChangeItem.id)">
						<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)',  margin: requirementsChangeIndex === 0 ? '0 20rpx 0' : requirementsChangeIndex === dataForm.prjrRquirementsChangeTotal ? '20rpx 20rpx 40rpx 20rpx' : '20rpx 20rpx 0', borderRadius: '20rpx' }">
							<view style="padding: 5rpx;">
								<wd-cell :title="requirementsChangeItem.reqcontent" custom-class="customCellContractWrap" custom-title-class="cellLabelTitle" ellipsis center>
									<wd-icon v-if="hasPermission('project:Customer:update')" name="edit-outline" size="18px" @click.stop="handleJumpChange(activeTab, '/projectPages/addrequiredchange/Index?pid=' + prjDetailInfo.id + '&id=' + requirementsChangeItem.id)"></wd-icon>
								</wd-cell>
								<view @click="handleJumpChange(activeTab, '/projectPages/requiredchangeinfo/Index?id=' + requirementsChangeItem.id)">
									<wd-cell title="客户信息" :value="requirementsChangeItem.customer" custom-class="customCell" ellipsis>
										<view style="display: flex; flex-direction: column; flex-wrap: wrap;">
											<view v-if="requirementsChangeItem.customer" style="display: flex; justify-content: flex-end; align-items: center; flex-wrap: wrap;">
												{{ requirementsChangeItem.customer }}
											</view>
											<view v-if="requirementsChangeItem.cstcontact" style="display: flex; justify-content: flex-end; align-items: center; flex-wrap: wrap;">
												{{ requirementsChangeItem.cstcontact }}
											</view>
										</view>
									</wd-cell>
									<wd-cell title="创建者/时间" :value="requirementsChangeItem.username" custom-class="customCell" ellipsis>
										<view style="display: flex; flex-direction: column; flex-wrap: wrap;">
											<view v-if="requirementsChangeItem.username" style="display: flex; justify-content: flex-end; align-items: center; flex-wrap: wrap;">
												{{ requirementsChangeItem.username }}
											</view>
											<view v-if="requirementsChangeItem.dbtime" style="display: flex; justify-content: flex-end; align-items: center; flex-wrap: wrap;">
												{{ requirementsChangeItem.dbtime }}
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
				<wd-status-tip image="../../static/search.png" tip="暂无需求变更数据" />
			</view>
		</view>

		<view v-if="activeTab === 6">
			<view v-if="prjDetailInfo.needDevelopList.length > 0">
				<uni-swipe-action>
					<uni-swipe-action-item v-for="(needDevelopItem, needDevelopIndex) in prjDetailInfo.needDevelopList" :key="needDevelopIndex" :right-options="developmentOptions" @click="handleDeleteDiffTypeChange(needDevelopItem.id)">
						<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)',  margin: needDevelopIndex === 0 ? '0 20rpx 0' : needDevelopIndex === dataForm.prjNeedDevelopmentTotal ? '20rpx 20rpx 40rpx 20rpx' : '20rpx 20rpx 0', borderRadius: '20rpx' }">
							<view style="padding: 5rpx; ">
								<wd-cell :title="needDevelopItem.affectedbusiness" custom-class="customCellContractWrap" custom-title-class="cellLabelTitle" ellipsis center>
									<wd-icon v-if="hasPermission('project:Development:update')" name="edit-outline" size="18px" @click.stop="handleJumpChange(activeTab, '/projectPages/addneeddevelop/Index?pid=' + prjDetailInfo.id + '&id=' + needDevelopItem.id)"></wd-icon>
								</wd-cell>
								<view @click="handleJumpChange(activeTab, '/projectPages/needdevelopinfo/Index?id=' + needDevelopItem.id)">
									<wd-cell title="设备名称" :value="needDevelopItem.devname" custom-class="customCell" ellipsis></wd-cell>
									<wd-cell title="研发对接人" :value="needDevelopItem.uname" custom-class="customCell" ellipsis></wd-cell>
									<wd-cell title="研发周期" :value="needDevelopItem.period + '天'" custom-class="customCell" ellipsis></wd-cell>
									<wd-cell title="创建者/时间" :value="needDevelopItem.username" custom-class="customCell" ellipsis>
										<view style="display: flex; flex-direction: column; flex-wrap: wrap;">
											<view v-if="needDevelopItem.username" style="display: flex; justify-content: flex-end; align-items: center; flex-wrap: wrap;">
												{{ needDevelopItem.username }}
											</view>
											<view v-if="needDevelopItem.dbtime" style="display: flex; justify-content: flex-end; align-items: center; flex-wrap: wrap;">
												{{ needDevelopItem.dbtime }}
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
				<wd-status-tip image="../../static/search.png" tip="暂无需要开发数据" />
			</view>
		</view>
		
		<view v-if="activeTab === 7">
			<view v-if="prjDetailInfo.prjSummaryDataList.length > 0">
				<uni-swipe-action>
					<uni-swipe-action-item v-for="(prjSummaryItem, prjSummaryIndex) in prjDetailInfo.prjSummaryDataList" :key="prjSummaryIndex" @click="handleDeleteDiffTypeChange(prjSummaryItem.id)">
						<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)',  margin: prjSummaryIndex === 0 ? '0 20rpx 0' : prjSummaryIndex === dataForm.prjSummaryTotal ? '20rpx 20rpx 40rpx 20rpx' : '20rpx 20rpx 0', borderRadius: '20rpx' }">
							<view style="padding: 5rpx; ">
								<wd-cell :title="prjSummaryItem.username + '的项目总结'" custom-class="customCellContractWrap" custom-title-class="cellLabelTitle" ellipsis center is-link clickable @click="handleJumpChange(activeTab, '/projectPages/prjsummaryinfo/Index?id=' + prjSummaryItem.id)"></wd-cell>
								<wd-cell title="字符数" :value="prjSummaryItem.charctras" custom-class="customCell" ellipsis></wd-cell>
							</view>
						</view>
					</uni-swipe-action-item>
				</uni-swipe-action>
			</view>
		
			<view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '0 20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
				<wd-status-tip image="../../static/search.png" tip="暂无需要开发数据" />
			</view>
		</view>
		
		<view v-if="activeTab === 8">
			<view v-if="prjDetailInfo.prjDailyDataList.length > 0">
				<uni-swipe-action>
					<uni-swipe-action-item v-for="(prjDailyItem, prjDailyIndex) in prjDetailInfo.prjDailyDataList" :key="prjDailyIndex" @click="handleDeleteDiffTypeChange(prjDailyItem.id)">
						<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)',  margin: prjDailyIndex === 0 ? '0 20rpx 0' : prjDailyIndex === dataForm.prjDailyTotal ? '20rpx 20rpx 40rpx 20rpx' : '20rpx 20rpx 0', borderRadius: '20rpx' }">
							<view style="padding: 20rpx; ">
								<view class="prjDailyInfoHeader">
									<view class="left">
										<wd-text bold :text="prjDailyItem.username + '的技术支持日报'" size="14px" :lines="1" :color="isDark ? '#ffffff' : '#000000'" />
									</view>
								
									<view class="right">
										<wd-text :text="prjDailyItem.dbtime" size="14px" :lines="1" />
									</view>
								</view>
								<view @click="handleJumpPageChange('/mePages/dailyreportinfo/Index?id=' + prjDailyItem.id)">
									<view v-if="!prjDailyItem.isObject">
										<view style="margin-top: 20rpx; font-size: 28rpx;">当天工作内容及成果描述:</view>
										<view style="margin: 10rpx 0; font-size: 28rpx; font-weight: bolder;">{{ prjDailyItem.context }}</view>
									</view>
									<view v-else>
										<view style="margin-top: 20rpx; font-size: 28rpx;">项目名称:</view>
										<view style="margin: 10rpx 0; font-size: 28rpx; font-weight: bolder;">{{ prjDailyItem.context.proname || '无' }}</view>
										<view style="margin: 10rpx 0; font-size: 28rpx;" v-if="prjDailyItem.context.notes">当天工作内容及成果描述:</view>
										<!-- eslint-disable-next-line vue/no-v-text-v-html-on-component -->
										<view v-if="prjDailyItem.context.notes" style="margin-top: 10rpx; font-size: 28rpx; font-weight: bolder;" v-html="prjDailyItem.context.notes ? prjDailyItem.context.notes.replace(/\n/g, '<br />') : ''"></view>
									</view>
									<view v-if="prjDailyItem.charctras" style="margin-top: 20rpx; font-size: 28rpx;">字符数:</view>
									<view v-if="prjDailyItem.charctras" style="margin: 10rpx 0; font-size: 28rpx; font-weight: bolder;">{{ prjDailyItem.charctras }}</view>
								</view>
							</view>
						</view>
					</uni-swipe-action-item>
				</uni-swipe-action>
			</view>
		
			<view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '0 20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
				<wd-status-tip image="../../static/search.png" tip="暂无需要开发数据" />
			</view>
		</view>
		
		<view v-if="activeTab === 9">
			<view v-if="prjDetailInfo.prjMojiDataList.length > 0">
				<uni-swipe-action>
					<uni-swipe-action-item v-for="(prjMojiItem, prjMojiIndex) in prjDetailInfo.prjMojiDataList" :key="prjMojiIndex" @click="handleDeleteDiffTypeChange(prjMojiItem.id)">
						<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)',  margin: prjMojiIndex === 0 ? '0 20rpx 0' : prjMojiIndex === dataForm.prjMojiTotal ? '20rpx 20rpx 40rpx 20rpx' : '20rpx 20rpx 0', borderRadius: '20rpx' }">
							<view style="padding: 20rpx;">
								<view class="prjDailyInfoHeader" style="margin-bottom: 10rpx;">
									<view class="left">
										<wd-text bold :text="prjMojiItem.cusname" size="14px" :lines="5" :color="isDark ? '#ffffff' : '#000000'" />
									</view>
								</view>
								
								<wd-cell title="气象信息token" custom-class="cellMojiClass">
									<view style="display: flex; justify-content: space-between; align-items: center; gap: 0 10rpx;">
										<wd-text bold :text="prjMojiItem.token" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
										<wd-icon v-if="prjMojiItem.token" name="file-copy" color="#909399" custom-style="margin-left: 10rpx;" @click="handleCopyChange(prjMojiItem.token)" />
									</view>
								</wd-cell>
								<wd-cell title="气象信息password" custom-class="cellMojiClass">
									<view style="display: flex; justify-content: space-between; align-items: center; gap: 0 10rpx;">
										<wd-text bold :text="prjMojiItem.passward" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
										<wd-icon v-if="prjMojiItem.passward" name="file-copy" color="#909399" custom-style="margin-left: 10rpx;" @click="handleCopyChange(prjMojiItem.passward)" />
									</view>
								</wd-cell>
								<wd-cell title="经/纬度" custom-class="cellMojiClass">
									<wd-text bold :text="prjMojiItem.longitude + ' / ' + prjMojiItem.latitude" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
								</wd-cell>
								<wd-cell title="合同项目名称" custom-class="cellMojiClass">
									<wd-text bold :text="prjMojiItem.pro" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
								</wd-cell>
								<wd-cell title="过期时间" custom-class="cellMojiClass">
									<wd-text bold :text="prjMojiItem.expiare" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
								</wd-cell>
								<wd-cell title="是否过期" custom-class="cellMojiClass">
									<wd-tag :type="prjMojiItem.status === 0 ? 'success' : prjMojiItem.status === 1 ? 'danger' : 'default'" round>
										{{ prjMojiItem.status === 0 ? '正常' : prjMojiItem.status === 1 ? '异常' : '未知' }}
									</wd-tag>
								</wd-cell>
								<wd-cell title="JSON格式" custom-class="cellMojiClass">
									<view style="display: flex; justify-content: space-between; align-items: center; gap: 0 10rpx;">
										<wd-text bold :text="prjMojiItem.jsonfmt" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
										<wd-icon v-if="prjMojiItem.jsonfmt" name="file-copy" color="#909399" custom-style="margin-left: 10rpx;" @click="handleCopyChange(prjMojiItem.jsonfmt)" />
									</view>
								</wd-cell>
								<wd-cell title="CSV格式" custom-class="cellMojiClass">
									<view style="display: flex; justify-content: space-between; align-items: center; gap: 0 10rpx;">
										<wd-text bold :text="prjMojiItem.csvfmt" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
										<wd-icon v-if="prjMojiItem.csvfmt" name="file-copy" color="#909399" custom-style="margin-left: 10rpx;" @click="handleCopyChange(prjMojiItem.csvfmt)" />
									</view>
								</wd-cell>
								<wd-cell title="备注" custom-class="cellMojiClass">
									<wd-text bold :text="prjMojiItem.notes" size="14px" :color="isDark ? '#ffffff' : '#000000'" :lines="5" />
								</wd-cell>
							</view>
						</view>
					</uni-swipe-action-item>
				</uni-swipe-action>
			</view>
		
			<view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '0 20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
				<wd-status-tip image="../../static/search.png" tip="暂无气象信息数据" />
			</view>
		</view>
		
		<view v-if="activeTab === 10">
			<view v-if="prjDetailInfo.projectParticipantDataList.length > 0">
				<uni-swipe-action>
					<uni-swipe-action-item v-for="(projectParticipantItem, projectParticipantIndex) in prjDetailInfo.projectParticipantDataList" :key="projectParticipantIndex" :right-options="projectParticipantOptions" @click="handleDeleteDiffTypeChange(projectParticipantItem.id)">
						<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: projectParticipantIndex === 0 ? '0 20rpx 0' : projectParticipantIndex === dataForm.projectParticipantTotal ? '20rpx 20rpx 40rpx 20rpx' : '20rpx 20rpx 0', borderRadius: '20rpx' }">
							<view style="padding: 5rpx;">
								<wd-cell :title="prjDetailInfo.proname" custom-class="customCellContractWrap" custom-title-class="cellLabelTitle" ellipsis center>
									<wd-icon v-if="hasPermission('project:Participant:update')" name="edit-outline" size="18px" @click.stop="handleJumpChange(activeTab, '/projectPages/addparticipant/Index?pid=' + prjDetailInfo.id + '&id=' + projectParticipantItem.id)"></wd-icon>
								</wd-cell>
								<view>
									<wd-cell title="参与人" :value="projectParticipantItem.prtcname" custom-class="customCell" ellipsis></wd-cell>
									<wd-cell title="创建者/时间" :value="projectParticipantItem.username" custom-class="customCell" ellipsis>
										<view style="display: flex; flex-direction: column; flex-wrap: wrap;">
											<view v-if="projectParticipantItem.username" style="display: flex; justify-content: flex-end; align-items: center; flex-wrap: wrap;">
												{{ projectParticipantItem.username }}
											</view>
											<view v-if="projectParticipantItem.dbtime" style="display: flex; justify-content: flex-end; align-items: center; flex-wrap: wrap;">
												{{ projectParticipantItem.dbtime }}
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
				<wd-status-tip image="../../static/search.png" tip="暂无项目参与人" />
			</view>
		</view>


		<wd-popup closable :safe-area-inset-bottom="true" :custom-style="`width: 90vw; margin-top: 162rpx; height: calc(100vh - 162rpx);`" v-model="uploadFileVisibleShow" position="left" @close="handleCloseChange">
		    <wd-gap height="50rpx" />
			
			<view v-if="hasPermission('project:File:insert')" style="padding-left: 20rpx; margin-top: 20rpx;">
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
		
		<wd-popup closable :z-index="99" v-model="participantsShow" custom-style="width: 90%; border-radius:32rpx; padding: 20rpx; max-height: 900rpx;" @close="participantsShow = false;">
			<wd-text bold text="项目参与人设置" :color="isDark ? '#ffffff' : '#000000'"></wd-text>
			
			<wd-gap height="20rpx"></wd-gap>
			
			<wd-checkbox-group cell v-model="selectedParticipantsIdList">
				<wd-checkbox v-for="(item, index) in allUserDataList" :key="index" :modelValue="item.id" shape="button">{{ item.username }}</wd-checkbox>
			</wd-checkbox-group>
			
			<view style="display: flex; justify-content: flex-end; align-items: center; gap: 0 10rpx; margin-top: 30rpx;">
				<wd-button type="info" @click="participantsShow = false;">取消</wd-button>
				<wd-button type="primary" :loading="participantsLoading" @click="handleParticipantsSubmitChange">提交</wd-button>
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
    :deep(.wd-cell__right) {
        flex: 2 !important;
    }
}

:deep(.uni-swipe:nth-child(1) .uni-swipe_button) {
    margin-top: 0 !important;
}

:deep(.uni-swipe_button) {
    margin-top: 20rpx !important;
}

.prjDailyInfoHeader {
	display: flex;
	justify-content: space-between;
	align-items: center;
	
	.left{
	    width: calc(100% - 270rpx);
	}
}

:deep(.cellMojiClass) {
    padding: 0 !important;
	
    .wd-cell__wrapper {
        padding: 10rpx !important;
    }
	
	.wd-cell__body {
		overflow: hidden !important;
		word-break: break-all !important;
	}
}

:deep(.wd-radio-group) {
	padding-top: 0 !important;
	padding-bottom: 20rpx !important;
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

.wot-theme-dark {
	:deep(.wd-tab) {
		background: #000000 !important;
	}
	
	:deep(.wd-tab__body) {
		background: #000000 !important;
	}
	
	:deep(.wd-tabs__container) {
		background: #000000 !important;
	}
}

:deep(.wd-cell__value) {
	font-weight: bolder !important;
}
</style>