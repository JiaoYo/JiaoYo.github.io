<script lang="ts" setup>
import { v4 as uuidv4 } from "uuid";
import { useMessage } from 'wot-design-uni';
import { uploadFile } from '@/utils/uploadFile';
import { onReady, onLoad, onUnload, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
import { reactive, ref, nextTick, computed } from 'vue';
import { useTheme } from '@/composables/theme/theme';
import { getExtensionFromUrl, downloadFile, isImageUrl, hasPermission, getFileType, isSupportedFileType } from '@/utils/index';
import CjxUpload from '@/uni_modules/cjx-upload/components/cjx-upload/cjx-upload.vue';
import CjxPreviewOffice from '@/uni_modules/cjx-previewOffice/components/cjx-previewOffice/cjx-previewOffice.vue';
import { QINIU_URL, QINIU_UPLOAD_URL } from '@/utils/request';
import uniSwipeAction from '@/components/uni-swipe-action/components/uni-swipe-action/uni-swipe-action.vue';
import uniSwipeActionItem from '@/components/uni-swipe-action/components/uni-swipe-action-item/uni-swipe-action-item.vue';
import { fetchGetUploadFileTokenInfo, fetchGetPrjInfo, fetchUpdatePrjInfo, fetchGetContractsPageByPrjId, fetchGetPrjMemberDataList, fetchGetDebugBusinessDataList, fetchGetDebugEquipmentDataList, fetchGetPrjCustomerDataList, fetchGetPrjDevelopmentDataList, fetchSavePrjFileInfo, fetchGetPrjFileDataList, fetchDeletePrjMemberInfo, fetchDeleteDebugEquipmentInfo, fetchDeleteDebugBusinessInfo, fetchDeletePrjCustomerInfo, fetchDeletePrjDevelopmentInfo, fetchUpdateDebugBusinessInfo, fetchDeletePrjFileDetailInfo, fetchDeletePrjFileInfo } from '@/service/index';

const { themeVars, theme } = useTheme();

const message = useMessage();

const activeTab = ref<number>(0);

const isDark = computed(() => theme.value === 'dark');

const userType = ref<number>(uni.getStorageSync('usertype'));

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
        title: '项目文件',
        value: 3
    },
    {
        title: '联系人',
        value: 4
    },
    // {
    //     title: '合同列表',
    //     value: 5
    // },
    {
        title: '需求变更',
        value: 5
    },
    {
        title: '需要开发',
        value: 6
    },
    // {
    //     title: '项目总结',
    //     value: 8
    // }
]);

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
    prjNeedDevelopmentTotal: 0
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
    contractDataList: [] as ContractItem[],
    memberDataList: [] as MemberItem[],
    debugBussinessList: [] as DebugbussinessItem[],
    debugEquipmentList: [] as DebugequipmentItem[],
    fileList: [] as any[],
    requirementsChangeList: [] as any[],
    needDevelopList: [] as any[],
    // 文件列表
    file1List: [],
    file2List: [],
    file3List: [],
    file4List: [],
    file5List: [],
    file6List: [],
    file7List: []
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
        console.log('data项目详情', data);
        prjDetailInfo.ckdbtime = data.ckdbtime;
        prjDetailInfo.ckusername = data.ckusername;
        prjDetailInfo.cpdbtime = data.cpdbtime;
        prjDetailInfo.dbtime = data.dbtime;
        prjDetailInfo.dispatch = data.dispatch;
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
        prjDetailInfo.username = data.username;
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
        console.log('data项目合同', data);
        dataForm.contractTotal = Number(data.total);
        prjDetailInfo.contractDataList = prjDetailInfo.contractDataList.concat(data.list);
    } catch (err) {
        console.error('获取项目合同失败', err);
    }
}

// 获取项目成员
async function getPrjMemberDataList() {
    if (dataForm.prjMemberPage === 1) {
        prjDetailInfo.memberDataList = [];
    }
    try {
        const data = await fetchGetPrjMemberDataList({ page: dataForm.prjMemberPage, limit: 100, pid: prjDetailInfo.id });
        console.log('data项目成员', data);
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
                url: '/projectPages/adddebugequipment/Index?pid=' + prjDetailInfo.id
            })
        } else if (currentTab === 2) {
            uni.navigateTo({
                url: '/projectPages/adddebugbusiness/Index?pid=' + prjDetailInfo.id
            })
        } else if (currentTab === 4) {
            uni.navigateTo({
                url: '/projectPages/addprjmember/Index?pid=' + prjDetailInfo.id
            })
        }  else if (currentTab === 5) {
            uni.navigateTo({
                url: '/projectPages/addrequiredchange/Index?pid=' + prjDetailInfo.id
            })
        } else if (currentTab === 6) {
            uni.navigateTo({
                url: '/projectPages/addneeddevelop/Index?pid=' + prjDetailInfo.id
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
        const data = await fetchGetDebugEquipmentDataList({ page: dataForm.prjDebugEquipmentPage, limit: 100, pid: prjDetailInfo.id });
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
        const data = await fetchGetDebugBusinessDataList({ page: dataForm.prjDebugBusinessPage, limit: 100, pid: prjDetailInfo.id });
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
        console.log('获取客户需求变更列表成功', data);
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

// 删除操作
async function handleDeleteDiffTypeChange(id: number) {
    try {
        message
        .confirm({
            msg: '确定要删除该' + (activeTab.value === 1 ? '调试设备' : activeTab.value === 2 ? '调试业务' : activeTab.value === 4 ? '联系人' : activeTab.value === 5 ? '需求变更' : activeTab.value === 6 ? '需要开发' : '调试设备') + '吗？',
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
            }
            const data = activeTab.value === 1 ? fetchDeleteDebugEquipmentInfo(id) : activeTab.value === 2 ? await fetchDeleteDebugBusinessInfo(id) : activeTab.value === 4 ? await fetchDeletePrjMemberInfo(id) : activeTab.value === 5 ? fetchDeletePrjCustomerInfo(id) : activeTab.value === 6 ? fetchDeletePrjDevelopmentInfo(id) : '';
            uni.showToast({
                icon: "none",
                title: "删除成功",
                duration: 1500,
                complete: async () => {
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

// 预览
const handlePreviewFileChange = (url: string) => {
    if (!isSupportedFileType(url) && !isImageUrl(url)) {
        uni.showToast({
            icon: 'none',
            duration: 1500,
            title: '该文件无法预览，请下载至本地进行查看'
        })
    } else {
        // uni.showToast({
        //     icon: 'none',
        //     duration: 1500,
        //     title: '该文件无法预览，请下载至本地进行查看'
        // })
    }
}

const handleTabsChange = ({ index, name }: { index: number, name: number }) => {
    if (index === 3) {

    }
}

// APP上传文件(项目图纸)
async function handleUploadClickChange(data: any) {
    if (data && data.length > 0) {
        let flag = true;
        for (let index = 0; index < data.length; index++) {
            if (data[index].size > 100 * 1024 * 1024) {
                flag = false;
                break;
            }
        }
        if (!flag) {
            uni.showToast({
                icon: 'none',
                title: '上传文件大小不得超过100M',
                duration: 1500
            })
            return false
        }
    }

    data.forEach(async(file: any) => {
        if (!file.url || !file.url.startsWith("https://pictures.linkqi.cn")) {
            await uploadFile(file, '', (response, file) => {
                const fileUrl = response.data;
                file.url = response.data;
                // 同步更新 model
                handleUpdateFileInsertChange(fileUrl, (file.name as string), 1);
            },
            (error, file) => {
                console.error('上传失败:', error);
            })
        }
    });
}

// APP上传文件(项目文件)
async function handleUploadIpaddressClickChange(data: any) {
    if (data && data.length > 0) {
        let flag = true;
        for (let index = 0; index < data.length; index++) {
            if (data[index].size > 100 * 1024 * 1024) {
                flag = false;
                break;
            }
        }
        if (!flag) {
            uni.showToast({
                icon: 'none',
                title: '上传文件大小不得超过100M',
                duration: 1500
            })
            return false
        }
    }

    data.forEach(async(file: any) => {
        if (!file.url || !file.url.startsWith("https://pictures.linkqi.cn")) {
            await uploadFile(file, '', (response, file) => {
                const fileUrl = response.data;
                prjDetailInfo.file2List = [];
                // 同步更新 model
                handleUpdateFileInsertChange(fileUrl, (file.name as string), 2);
            },
            (error, file) => {
                console.error('上传失败:', error);
            })
        }
    });
}

// APP上传文件(工程文件压缩包)
async function handleUploadProjectFileClickChange(data: any) {
    if (data && data.length > 0) {
        let flag = true;
        for (let index = 0; index < data.length; index++) {
            if (data[index].size > 100 * 1024 * 1024) {
                flag = false;
                break;
            }
        }
        if (!flag) {
            uni.showToast({
                icon: 'none',
                title: '上传文件大小不得超过100M',
                duration: 1500
            })
            return false
        }
    }

    data.forEach(async(file: any) => {
        if (!file.url || !file.url.startsWith("https://pictures.linkqi.cn")) {
            await uploadFile(file, '', (response, file) => {
                const fileUrl = response.data;
                prjDetailInfo.file3List = [];
                // 同步更新 model
                handleUpdateFileInsertChange(fileUrl, (file.name as string), 3);
            },
            (error, file) => {
                console.error('上传失败:', error);
            })
        }
    });
}

// APP上传文件(项目现场照片)
async function handleUploadFileClickChange(data: any) {
    if (data && data.length > 0) {
        let flag = true;
        for (let index = 0; index < data.length; index++) {
            if (data[index].size > 100 * 1024 * 1024) {
                flag = false;
                break;
            }
        }
        if (!flag) {
            uni.showToast({
                icon: 'none',
                title: '上传文件大小不得超过100M',
                duration: 1500
            })
            return false
        }
    }

    data.forEach(async(file: any) => {
        if (!file.url || !file.url.startsWith("https://pictures.linkqi.cn")) {
            await uploadFile(file, '', (response, file) => {
                const fileUrl = response.data;
                prjDetailInfo.file4List = [];
                // 同步更新 model
                handleUpdateFileInsertChange(fileUrl, (file.name as string), 4);
            },
            (error, file) => {
                console.error('上传失败:', error);
            })
        }
    });
}

// APP上传文件(网络通讯简图)
async function handleUploadNetworkClickChange(data: any) {
    if (data && data.length > 0) {
        let flag = true;
        for (let index = 0; index < data.length; index++) {
            if (data[index].size > 100 * 1024 * 1024) {
                flag = false;
                break;
            }
        }
        if (!flag) {
            uni.showToast({
                icon: 'none',
                title: '上传文件大小不得超过100M',
                duration: 1500
            })
            return false
        }
    }

    data.forEach(async(file: any) => {
        if (!file.url || !file.url.startsWith("https://pictures.linkqi.cn")) {
            await uploadFile(file, '', (response, file) => {
                const fileUrl = response.data;
                prjDetailInfo.file5List = [];
                // 同步更新 model
                handleUpdateFileInsertChange(fileUrl, (file.name as string), 5);
            },
            (error, file) => {
                console.error('上传失败:', error);
            })
        }
    });
}

// APP上传文件(组态画面工程备份)
async function handleUploadConfigurationClickChange(data: any) {
    if (data && data.length > 0) {
        let flag = true;
        for (let index = 0; index < data.length; index++) {
            if (data[index].size > 100 * 1024 * 1024) {
                flag = false;
                break;
            }
        }
        if (!flag) {
            uni.showToast({
                icon: 'none',
                title: '上传文件大小不得超过100M',
                duration: 1500
            })
            return false
        }
    }

    data.forEach(async(file: any) => {
        if (!file.url || !file.url.startsWith("https://pictures.linkqi.cn")) {
            await uploadFile(file, '', (response, file) => {
                const fileUrl = response.data;
                prjDetailInfo.file6List = [];
                // 同步更新 model
                handleUpdateFileInsertChange(fileUrl, (file.name as string), 6);
            },
            (error, file) => {
                console.error('上传失败:', error);
            })
        }
    });
}

// APP上传文件(验收确认单拍照照片)
async function handleUploadCheckClickChange(data: any) {
    if (data && data.length > 0) {
        let flag = true;
        for (let index = 0; index < data.length; index++) {
            if (data[index].size > 100 * 1024 * 1024) {
                flag = false;
                break;
            }
        }
        if (!flag) {
            uni.showToast({
                icon: 'none',
                title: '上传文件大小不得超过100M',
                duration: 1500
            })
            return false
        }
    }

    data.forEach(async(file: any) => {
        if (!file.url || !file.url.startsWith("https://pictures.linkqi.cn")) {
            await uploadFile(file, '', (response, file) => {
                const fileUrl = response.data;
                prjDetailInfo.file7List = [];
                // 同步更新 model
                handleUpdateFileInsertChange(fileUrl, (file.name as string), 7);
            },
            (error, file) => {
                console.error('上传失败:', error);
            })
        }
    });
}

// 更新文件
async function handleUpdateFileInsertChange(fileUrl: string, fileName: string, sort: number) {
    try {
        const data = await fetchSavePrjFileInfo([{
            file: fileUrl,
            filename: fileName,
            pid: prjDetailInfo.id,
            sort: sort
        }]);
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
async function handleUpdateStatusChange(id: number, status: number) {
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
            msg: status === 0 ? '确定要通过申请吗？' : status === 1 ? '确定要开始调试吗？' : status === 2 ? '确定已完成调试吗？' : status === 3 ? '确定已审核完成吗？' : '确定要开始调试吗？',
            title: '提示',
            confirmButtonProps: {
                type: 'error',
            },
        })
        .then(async () => {
            const data = await fetchUpdateDebugBusinessInfo([{ id, pid: prjDetailInfo.id, status }]);
            uni.showToast({
                icon: "none",
                title: status === 0 ? '已通过申请' : status === 1 ? "已开始调试" : status === 2 ? '已完成调试' : '已审核完成',
                duration: 1500,
                complete: async () => {
                    dataForm.prjDebugBusinessPage = 1;
                    getContractDebugBusinessDataList();
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
    }
}

onLoad((options: any) => {
    prjDetailInfo.id = options.pid;
    activeTab.value = options.hasOwnProperty('activeTab') ? Number(options.activeTab) || 0 : 0;
    getContractDetailInfo();
    // getPrjContractsDataList();
    getContractDebugEquipmentDataList();
    getContractDebugBusinessDataList();
    getContractPrjFileInfo();
    getPrjMemberDataList();
    getPrjCustomerDataList();
    getPrjDevelopmentDataList();
    uni.$on('refreshList', getDataList); // 监听刷新事件
});

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
    }
});
</script>

<template>
    <wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
		<wd-message-box />
        <wd-navbar left-arrow title="项目详情" safe-area-inset-top placeholder fixed :bordered="false" @click-left="handleClickLeft">
            <template #right>
                <wd-button v-if="(activeTab === 1 && hasPermission('project:Equipment:insert')) || (activeTab === 2 && hasPermission('project:Debug:insert')) || (activeTab === 4 && hasPermission('project:Contact:insert')) || (activeTab === 5 && hasPermission('project:Customer:insert')) || (activeTab === 6 && hasPermission('project:Development:insert'))" type="icon" icon="add-circle" size="large" @click="handleJumpChange(activeTab, null)"></wd-button>
            </template>
        </wd-navbar>
		
		<wd-message-box />

        <wd-tabs animated v-model="activeTab" @change="handleTabsChange">
            <block v-for="(item, index) in tabsList" :key="index">
                <!-- <wd-tab :title="item.title"  :disabled="index === 5 ? (prjDetailInfo.cs === 0 ? true : false) : index === 6 ? (prjDetailInfo.ds === 0 ? true : false) : false"> -->
                <wd-tab :title="item.title">
                    <wd-gap :bg-color="isDark ? '#000000' : '#F5F5F5'"  :height="activeTab === 3 ? '100rpx' : '110rpx'" />

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
                                    <wd-tag round :type="prjDetailInfo.ptype === 0 ? 'success' : prjDetailInfo.ptype === 1 ? 'danger' : 'default'">
                                        {{ prjDetailInfo.ptype === 0 ? '正常' : prjDetailInfo.ptype === 1 ? '延期' : '未知'  }}
                                    </wd-tag>
                                </wd-cell>
                                <wd-cell title="验收人" v-if="prjDetailInfo.status === 3" :value="prjDetailInfo.ckusername || '--'" custom-class="customCell" />
                                <wd-cell title="验收时间" v-if="prjDetailInfo.status === 3" :value="prjDetailInfo.ckdbtime" custom-class="customCell" />
                                <wd-cell title="调试类型" custom-class="customCell">
                                    <wd-tag type="primary" round>
                                        {{ prjDetailInfo.dtype === 0 ? '现场调试' : prjDetailInfo.dtype === 1 ? '远程调试' : prjDetailInfo.dtype === 2 ? '无需调试' : '未知' }}
                                    </wd-tag>
                                </wd-cell>
                                <wd-cell title="项目地址" :value="prjDetailInfo.prosite" custom-class="customCell">
                                    <view style="display: flex; justify-content: space-between; align-items: center;">
                                        <view style="margin-right: 5px;">{{ prjDetailInfo.prosite }}</view>
                                        <wd-icon name="location" size="24px" @click="handleOpenMapChange(prjDetailInfo.longitude, prjDetailInfo.latitude)"></wd-icon>
                                    </view>
                                </wd-cell>
                                <wd-cell title="项目详细地址" :value="prjDetailInfo.proaddr" custom-class="customCell"></wd-cell>
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
                                    <view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: businessDeviceIndex === 0 ? '0 20rpx 0' : businessDeviceIndex === dataForm.prjDebugEquipmentTotal ? '20rpx 20rpx 40rpx 20rpx' : '20rpx 20rpx 0', borderRadius: '20rpx' }">
                                        <view style="padding: 5rpx; ">
                                            <wd-cell :title="businessDeviceItem.devname" custom-class="customCellDebugbusinessWrap" custom-title-class="cellLabelTitle" ellipsis center>
                                                <view style="display: flex; align-items: center; justify-content: flex-end; gap: 0 20rpx;">
                                                    <wd-tag :type="businessDeviceItem.status === 3 || businessDeviceItem.status === 4 ? 'danger' : businessDeviceItem.status === 2 ? 'warning' : 'primary'" round>
                                                        {{ businessDeviceItem.status === 0 ? '未清点' : businessDeviceItem.status === 1 ? '正常' : businessDeviceItem.status === 2 ? '增补' : businessDeviceItem.status === 3 ? '退货' : businessDeviceItem.status === 4 ? '换货' : '未清点' }}
                                                    </wd-tag>
                                                    <wd-icon v-if="hasPermission('project:Equipment:update')" name="edit-outline" size="18px" @click.stop="handleJumpChange(activeTab, '/projectPages/adddebugequipment/Index?pid=' + prjDetailInfo.id + '&id=' + businessDeviceItem.id)"></wd-icon>
                                                </view>
                                            </wd-cell>
                                            <view @click="handleJumpChange(2, '/projectPages/debugequipmentinfo/Index?id=' + businessDeviceItem.id)">
                                                <!-- <wd-cell title="设备名称/型号" :value="businessDeviceItem.devname + ' / ' + (businessDeviceItem.devmodel || '--')" custom-class="customCell" ellipsis></wd-cell> -->
                                                <wd-cell title="型号" :value="businessDeviceItem.devmodel" custom-class="customCell" ellipsis></wd-cell>
                                                <wd-cell title="数量" :value="businessDeviceItem.devunit ? businessDeviceItem.devnum + businessDeviceItem.devunit : businessDeviceItem.devnum" custom-class="customCell" ellipsis></wd-cell>
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
                                                <!-- <wd-cell title="备注" :value="businessDeviceItem.notes" custom-class="customCell" ellipsis></wd-cell>
                                                <wd-cell title="创建者" :value="businessDeviceItem.username" custom-class="customCell" ellipsis />
                                                <wd-cell title="创建时间" :value="businessDeviceItem.dbtime" custom-class="customCell" ellipsis /> -->
                                            </view>
                                        </view>
                                    </view>
                                </uni-swipe-action-item>
                            </uni-swipe-action>
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
                                                <wd-cell title="调试工程师" :value="businessItem.dbusername" custom-class="customCell" />
                                                <wd-cell title="起止时间" v-if="businessItem.status > 0" :value="businessItem.dbdbtime + '~' + (businessItem.dedbtime || '--')" custom-class="customCell"></wd-cell>
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

                                            <wd-gap bg-color="#cccccc" height="2rpx" v-if="hasPermission('project:Debug:update') && (businessItem.status === -1 || businessItem.status === 0 || businessItem.status === 1 || businessItem.status === 2) && (userType === 0 || userType === 2 || userType === 3)"></wd-gap>

                                            <view style="display: flex; justify-content: flex-end; margin-top: 10rpx; gap: 0 10rpx; padding-bottom: 10rpx;" v-if="hasPermission('project:Debug:update') && (businessItem.status === -1 || businessItem.status === 0 || businessItem.status === 1 || businessItem.status === 2) && (userType === 0 || userType === 2 || userType === 3)">
                                                <wd-button v-if="hasPermission('project:Debug:update') && businessItem.status === -1 && (userType === 0 || userType === 2)" size="small" type="primary" @click.stop="handleUpdateStatusChange(businessItem.id, 0)">通过申请</wd-button>
                                                <wd-button v-if="hasPermission('project:Debug:update') && businessItem.status === 0 && (userType === 0 || userType === 2 || userType === 3)" size="small" type="primary" @click.stop="handleUpdateStatusChange(businessItem.id, 1)">启动</wd-button>
                                                <wd-button v-if="hasPermission('project:Debug:update') && businessItem.status === 1 && (userType === 0 || userType === 2 || userType === 3)" size="small" type="primary" @click.stop="handleUpdateStatusChange(businessItem.id, 2)">完成调试</wd-button>
                                                <wd-button v-if="hasPermission('project:Debug:update') && businessItem.status === 2 && (userType === 0 || userType === 2)" size="small" type="primary" @click.stop="handleUpdateStatusChange(businessItem.id, 3)">审核</wd-button>
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
                            <view v-if="hasPermission('project:File:upload')">
                                <CjxUpload v-model="prjDetailInfo.file1List" multiple @change="handleUploadClickChange">
                                    <template #default>
                                        <wd-icon name="cloud-upload" size="22px"></wd-icon>
                                    </template>
                                </CjxUpload>
                            </view>
                        </view>

                        <view v-if="projectDrawingsFileList.length > 0" :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)',margin: '0 20rpx 20rpx', borderRadius: '20rpx' }">
                            <uni-swipe-action>
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
                            </uni-swipe-action>
                        </view>

                        <view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
                            <wd-status-tip :image-size="{ height: 80, width: 80 }" image="../../static/search.png" tip="暂无项目图纸" />
                        </view>

                        <view style="display: flex; justify-content: left; align-items: center; justify-content: space-between; flex-wrap: nowrap; padding: 10px 0 10rpx 10px; width: calc(100vw - 60rpx);">
                            <view style="display: flex; align-items: center;">
                                <view style="width: 5px; height: 15px; background: #0055FE;"></view>
                                <view style="margin-left: 10rpx; font-weight: bolder;">项目文件</view>
                            </view>
                            <view v-if="hasPermission('project:File:upload')">
                                <CjxUpload v-model="prjDetailInfo.file2List" :limit="1" multiple @change="handleUploadIpaddressClickChange">
                                    <template #default>
                                        <wd-icon name="cloud-upload" size="22px"></wd-icon>
                                    </template>
                                </CjxUpload>
                            </view>
                        </view>

                        <view v-if="ipAddressList.length > 0" :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '0 20rpx 20rpx', borderRadius: '20rpx' }">
                            <uni-swipe-action>
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
                            </uni-swipe-action>
                        </view>

                        <view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
                            <wd-status-tip :image-size="{ height: 80, width: 80 }" image="../../static/search.png" tip="暂无项目文件" />
                        </view>

                        <view style="display: flex; justify-content: left; align-items: center; justify-content: space-between; flex-wrap: nowrap; padding: 10px 0 10rpx 10px; width: calc(100vw - 60rpx);">
                            <view style="display: flex; align-items: center;">
                                <view style="width: 5px; height: 15px; background: #0055FE;"></view>
                                <view style="margin-left: 10rpx; font-weight: bolder;">工程文件压缩包</view>
                            </view>
                            <view v-if="hasPermission('project:File:upload')">
                                <CjxUpload v-model="prjDetailInfo.file3List" :limit="1" multiple @change="handleUploadProjectFileClickChange">
                                    <template #default>
                                        <wd-icon name="cloud-upload" size="22px"></wd-icon>
                                    </template>
                                </CjxUpload>
                            </view>
                        </view>

                        <view v-if="projectFileList.length > 0" :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '0 20rpx 20rpx', borderRadius: '20rpx' }">
                            <uni-swipe-action>
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
                                            <!-- <view class="right">
                                                <wd-text bold :text="projectFileItem.url.split('?')[1]" size="15px" :color="isDark ? '#ffffff' : '#000000'" />
                                                <view style="display: flex; justify-content: space-between; align-items: center; margin-top: 20rpx; width: calc(100vw - 120px);">
                                                    <wd-text bold :text="projectFileItem.username" />
                                                    <wd-text bold :text="projectFileItem.dbtime" />
                                                </view>
                                            </view> -->

                                            <view style="display: inline-block; width: 22px; margin-left: 18px;" @click.stop="downloadFile(projectFileItem.url, null)">
                                                <wd-icon name="cloud-download" size="22px"></wd-icon>
                                            </view>
                                        </view>
                                    </view>
                                </uni-swipe-action-item>
                            </uni-swipe-action>
                        </view>

                        <view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
                            <wd-status-tip :image-size="{ height: 80, width: 80 }" image="../../static/search.png" tip="暂无工程文件压缩包" />
                        </view>

                        <view style="display: flex; justify-content: left; align-items: center; justify-content: space-between; flex-wrap: nowrap; padding: 10px 0 10rpx 10px; width: calc(100vw - 60rpx);">
                            <view style="display: flex; align-items: center;">
                                <view style="width: 5px; height: 15px; background: #0055FE;"></view>
                                <view style="margin-left: 10rpx; font-weight: bolder;">项目现场照片</view>
                            </view>
                            <view v-if="hasPermission('project:File:upload')">
                                <CjxUpload v-model="prjDetailInfo.file4List" :limit="1" multiple @change="handleUploadFileClickChange">
                                    <template #default>
                                        <wd-icon name="cloud-upload" size="22px"></wd-icon>
                                    </template>
                                </CjxUpload>
                            </view>
                        </view>

                        <!-- <wd-upload v-if="fileList.length > 0" :file-list="fileList" :limit="fileList.length" disabled></wd-upload> -->
                        <view v-if="fileList.length > 0" :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '0 20rpx 20rpx', borderRadius: '20rpx' }">
                            <uni-swipe-action>
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
                                            <!-- <view class="right">
                                                <wd-text bold :text="fileItem.url.split('?')[1]" size="15px" :color="isDark ? '#ffffff' : '#000000'" />
                                                <view style="display: flex; justify-content: space-between; align-items: center; margin-top: 20rpx; width: calc(100vw - 120px);">
                                                    <wd-text bold :text="fileItem.username" />
                                                    <wd-text bold :text="fileItem.dbtime" />
                                                </view>
                                            </view> -->

                                            <view style="display: inline-block; width: 22px; margin-left: 18px;" @click.stop="downloadFile(fileItem.url, null)">
                                                <wd-icon name="cloud-download" size="22px"></wd-icon>
                                            </view>
                                        </view>
                                    </view>
                                </uni-swipe-action-item>
                            </uni-swipe-action>
                        </view>

                        <view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
                            <wd-status-tip :image-size="{ height: 80, width: 80 }" image="../../static/search.png" tip="暂无项目现场照片" />
                        </view>

                        <view style="display: flex; justify-content: left; align-items: center; justify-content: space-between; flex-wrap: nowrap; padding: 10px 0 10rpx 10px; width: calc(100vw - 60rpx);">
                            <view style="display: flex; align-items: center;">
                                <view style="width: 5px; height: 15px; background: #0055FE;"></view>
                                <view style="margin-left: 10rpx; font-weight: bolder;">网络通讯简图</view>
                            </view>
                            <view v-if="hasPermission('project:File:upload')">
                                <CjxUpload v-model="prjDetailInfo.file5List" :limit="1" multiple @change="handleUploadNetworkClickChange">
                                    <template #default>
                                        <wd-icon name="cloud-upload" size="22px"></wd-icon>
                                    </template>
                                </CjxUpload>
                            </view>
                        </view>

                        <view v-if="networkCommunicationDiagramFileList.length > 0" :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '0 20rpx 20rpx', borderRadius: '20rpx' }">
                            <uni-swipe-action>
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

                                            <!-- <view class="right">
                                                <wd-text bold :text="networkCommunicationDiagramFileItem.url.split('?')[1]" size="15px" :color="isDark ? '#ffffff' : '#000000'" />
                                                <view style="display: flex; justify-content: space-between; align-items: center; margin-top: 20rpx; width: calc(100vw - 120px);">
                                                    <wd-text bold :text="networkCommunicationDiagramFileItem.username" />
                                                    <wd-text bold :text="networkCommunicationDiagramFileItem.dbtime" />
                                                </view>
                                            </view> -->

                                            <view style="display: inline-block; width: 22px; margin-left: 18px;" @click.stop="downloadFile(networkCommunicationDiagramFileItem.url, null)">
                                                <wd-icon name="cloud-download" size="22px"></wd-icon>
                                            </view>
                                        </view>
                                    </view>
                                </uni-swipe-action-item>
                            </uni-swipe-action>
                        </view>

                        <view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
                            <wd-status-tip :image-size="{ height: 80, width: 80 }" image="../../static/search.png" tip="暂无网络通讯简图" />
                        </view>

                        <view style="display: flex; justify-content: left; align-items: center; justify-content: space-between; flex-wrap: nowrap; padding: 10px 0 10rpx 10px; width: calc(100vw - 60rpx);">
                            <view style="display: flex; align-items: center;">
                                <view style="width: 5px; height: 15px; background: #0055FE;"></view>
                                <view style="margin-left: 10rpx; font-weight: bolder;">组态画面工程备份</view>
                            </view>
                            <view v-if="hasPermission('project:File:upload')">
                                <CjxUpload v-model="prjDetailInfo.file6List" :limit="1" multiple @change="handleUploadConfigurationClickChange">
                                    <template #default>
                                        <wd-icon name="cloud-upload" size="22px"></wd-icon>
                                    </template>
                                </CjxUpload>
                            </view>
                        </view>

                        <view v-if="configurationProjectBackupFileList.length > 0" :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '0 20rpx 20rpx', borderRadius: '20rpx' }">
                            <uni-swipe-action>
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

                                            <!-- <view class="right">
                                                <wd-text bold :text="configurationProjectBackupFileItem.url.split('?')[1]" size="15px" :color="isDark ? '#ffffff' : '#000000'" />
                                                <view style="display: flex; justify-content: space-between; align-items: center; margin-top: 20rpx; width: calc(100vw - 120px);">
                                                    <wd-text bold :text="configurationProjectBackupFileItem.username" />
                                                    <wd-text bold :text="configurationProjectBackupFileItem.dbtime" />
                                                </view>
                                            </view> -->

                                            <view style="display: inline-block; width: 22px; margin-left: 18px;" @click.stop="downloadFile(configurationProjectBackupFileItem.url, null)">
                                                <wd-icon name="cloud-download" size="22px"></wd-icon>
                                            </view>
                                        </view>
                                    </view>
                                </uni-swipe-action-item>
                            </uni-swipe-action>
                        </view>

                        <view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
                            <wd-status-tip :image-size="{ height: 80, width: 80 }" image="../../static/search.png" tip="暂无组态画面工程备份" />
                        </view>

                        <view style="display: flex; justify-content: left; align-items: center; justify-content: space-between; flex-wrap: nowrap; padding: 10px 0 10rpx 10px; width: calc(100vw - 60rpx);">
                            <view style="display: flex; align-items: center;">
                                <view style="width: 5px; height: 15px; background: #0055FE;"></view>
                                <view style="margin-left: 10rpx; font-weight: bolder;">验收确认单拍照照片</view>
                            </view>
                            <view v-if="hasPermission('project:File:upload')">
                                <CjxUpload v-model="prjDetailInfo.file7List" :limit="1" multiple @change="handleUploadCheckClickChange">
                                    <template #default>
                                        <wd-icon name="cloud-upload" size="22px"></wd-icon>
                                    </template>
                                </CjxUpload>
                            </view>
                        </view>

                        <view v-if="acceptanceConfirmationFileList.length > 0" :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: '0 20rpx 20rpx', borderRadius: '20rpx' }">
                            <uni-swipe-action>
                                <uni-swipe-action-item v-for="(acceptanceConfirmationFileItem, acceptanceConfirmationFileIndex) in acceptanceConfirmationFileList" :key="acceptanceConfirmationFileIndex" :right-options="options" @click="handleDeleteFileChange(acceptanceConfirmationFileItem.url, acceptanceConfirmationFileItem.id)">
                                    <view style="padding: 20rpx;">
                                        <view class="prjInfoHeader">
                                            <view class="left">
                                                <wd-img :width="30" :height="30" :src="acceptanceConfirmationFileItem.url" v-if="isImageUrl(acceptanceConfirmationFileItem.url)" :preview-src="acceptanceConfirmationFileItem.url" :enable-preview="true" />
                                                <wd-img :width="30" :height="30" v-else :src="extIconMap[getExtensionFromUrl(acceptanceConfirmationFileItem.url)] === 0 ? 'https://dingiiot.com/fileImg/docx.png' : extIconMap[getExtensionFromUrl(acceptanceConfirmationFileItem.url)] === 1 ? 'https://dingiiot.com/fileImg/pdf.png' : extIconMap[getExtensionFromUrl(acceptanceConfirmationFileItem.url)] === 2 ? 'https://dingiiot.com/fileImg/xlsx.png': extIconMap[getExtensionFromUrl(acceptanceConfirmationFileItem.url)] === 3 ? 'https://dingiiot.com/fileImg/rar.png' : extIconMap[getExtensionFromUrl(acceptanceConfirmationFileItem.url)] === 4 ? 'https://dingiiot.com/fileImg/tar.png' : extIconMap[getExtensionFromUrl(acceptanceConfirmationFileItem.url)] === 5 ? 'https://dingiiot.com/fileImg/ppt.png' : 'https://dingiiot.com/fileImg/docx.png'" />
                                            </view>

                                            <view class="right" v-if="isSupportedFileType(acceptanceConfirmationFileItem.url)">
                                                <cjx-previewOffice
                                                    ref="previewOfficeRef"
                                                    :value="acceptanceConfirmationFileItem.url"
                                                    :name="acceptanceConfirmationFileItem.filename"
                                                    type="word"
                                                >
                                                    <span style="display: inline-block; word-wrap: break-word; width: calc(100vw - 240rpx);">{{ acceptanceConfirmationFileItem.filename }}</span>
                                                </cjx-previewOffice>
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

                                            <!-- <view class="right">
                                                <wd-text bold :text="acceptanceConfirmationFileItem.filename" size="15px" :color="isDark ? '#ffffff' : '#000000'" />
                                                <view style="display: flex; justify-content: space-between; align-items: center; margin-top: 20rpx; width: calc(100vw - 120px);">
                                                    <wd-text bold :text="acceptanceConfirmationFileItem.username" />
                                                    <wd-text bold :text="acceptanceConfirmationFileItem.dbtime" />
                                                </view>
                                            </view> -->

                                            <view style="display: inline-block; width: 22px; margin-left: 18px;" @click.stop="downloadFile(acceptanceConfirmationFileItem.url, null)">
                                                <wd-icon name="cloud-download" size="22px"></wd-icon>
                                            </view>
                                        </view>
                                    </view>
                                </uni-swipe-action-item>
                            </uni-swipe-action>
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
                                                <wd-cell title="对接人" :value="memberItem.docker" custom-class="customCell" ellipsis></wd-cell>
                                                <wd-cell title="联系方式" :value="memberItem.pcontact" custom-class="customCell" ellipsis>
                                                    <view v-if="memberItem.pcontact" @click.stop="handleMakePhoneNumber(memberItem.pcontact)">
                                                        <wd-text :text="memberItem.pcontact" type="warning" decoration="underline" />
                                                    </view>
                                                </wd-cell>
                                                <wd-cell title="创建者/时间" :value="memberItem.username" custom-class="customCell" ellipsis>
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
                </wd-tab>
            </block>
        </wd-tabs>
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
    // padding: 10rpx 10rpx 10rpx 10rpx !important;
}

:deep(.uni-swipe:nth-child(1) .uni-swipe_button) {
    margin-top: 0 !important;
}

:deep(.uni-swipe_button) {
    margin-top: 20rpx !important;
}
</style>