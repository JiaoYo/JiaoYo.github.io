<script lang="ts" setup>
import { useToast, useMessage } from 'wot-design-uni';
import { reactive, ref, onMounted, computed, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { hasPermission, getSystemDate, getCurrentWeekDates } from '@/utils/index';
import { onReady, onLoad, onUnload, onPageScroll, onPullDownRefresh, onReachBottom, onBackPress } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import { fetchGetPrjDataList, fetchDeletePrjdailyreportInfo, fetchGetPrjdailyreportList, fetchGetDialyCommentDataList, fetchSaveDialyCommentInfo, fetchDeleteDialyCommentInfo, fetchGetAllUserDataList } from '@/service/index';
import DailyImagePopup from './modules/daily-image-popup.vue';
import DailyImageTextPopup from './modules/daily-image-text-popup.vue';

const { t } = useI18n();

const { themeVars, theme } = useTheme();

const message = useMessage();

const prjShow = ref<boolean>(false);

const clickLock = ref<boolean>(false);

const isDark = computed(() => theme.value === 'dark');

// 日报新增/编辑时间窗：每日 18:00 – 次日 04:59
const canAddOrEdit = computed(() => {
    const now = new Date();
    return now.getHours() >= 18 || (now.getHours() === 17 && now.getMinutes() >= 30) || now.getHours() < 5;
});

// 填报时间：只展示年月日（兼容后端返回 时间戳 或 YYYY-MM-DD 或 YYYY-MM-DD HH:mm:ss）
function formatDbtime(val: any) {
    if (!val) return '';
    const s = String(val);
    if (/^\d{10,}$/.test(s)) {
        return getSystemDate(0, Number(s));
    }
    return s.slice(0, 10);
}

// 是否补录：填报日期(dbtime)与更新时间(updbtime)不在同一天，则视为补录
function isMakeupReport(item: any) {
    const db = formatDbtime(item && item.dbtime);
    const up = formatDbtime(item && item.updbtime);
    return !!db && !!up && db !== up;
}

// 日报图片附件（reportcon 为 JSON 数组：[{id: 图片id, content: 识别内容}]）
function parseReportCons(row: any): any[] {
    if (!row || !row.reportcon) return [];
    try {
        const arr = JSON.parse(row.reportcon);
        return Array.isArray(arr) ? arr : [];
    } catch (e) {
        return [];
    }
}

// 日报图片弹窗状态
const imageVisible = ref<boolean>(false);
const imagePid = ref<number>(0);
const imageCanEdit = ref<boolean>(false);
const imageUsername = ref<string>('');
const imageDbtime = ref<string>('');

// 阶段实施成果（图片识别内容审核）弹窗状态
const textVisible = ref<boolean>(false);
const textPid = ref<number>(0);
const textReportcon = ref<string>('[]');
const textUsername = ref<string>('');
const textDbtime = ref<string>('');

// 打开日报图片弹窗（仿 web 端 openImages）：管理员/审核走识别内容审核弹窗，其余走图片管理弹窗（仅本人可编辑）
function openImages(row: any, canEdit: boolean) {
    if ((userType.value === 0 || userType.value === 2) && canEdit) {
        textPid.value = row.id;
        textReportcon.value = row.reportcon || '[]';
        textUsername.value = row.username || '';
        textDbtime.value = row.dbtime || '';
        textVisible.value = true;
        return;
    }
    imagePid.value = row.id;
    imageCanEdit.value = userId.value === row.creater;
    imageUsername.value = row.username || '';
    imageDbtime.value = row.dbtime || '';
    imageVisible.value = true;
}

// 查看某张图片的识别内容（仿 web 端 showReportText）：管理员/审核进审核弹窗，usertype=4 跳转日报详情，普通用户只读预览
function showReportText(row: any, idx: number, content: string) {
    if (userType.value === 0 || userType.value === 2) {
        openImages(row, true);
        return;
    }
    // usertype=4：仅可见阶段实施成果，点击进入日报详情页
    if (userType.value === 4) {
        if (clickLock.value) return;
        clickLock.value = true;
        uni.navigateTo({
            url: '/mePages/dailyreportinfo/Index?id=' + row.id,
            complete: () => {
                clickLock.value = false;
            }
        });
        return;
    }
    uni.showModal({
        title: `${row.username || '-'} ${formatDbtime(row.dbtime)} 第${idx + 1}张图片的识别内容`,
        content: content || '（未识别）',
        showCancel: false,
    });
}

// 返回键/侧滑手势：日报图片、阶段实施成果弹窗打开时先关弹窗，避免直接退回上一页
onBackPress(() => {
    if (imageVisible.value || textVisible.value) {
        imageVisible.value = false;
        textVisible.value = false;
        return true;
    }
    return false;
});

// 顶部固定区域高度（px）
const topFixedHeight = ref<number>(0);

const projectTagColors = ['#1677ff'];
const state = ref<any>('loading');
const dataList = ref<any[]>([]);
const total = ref<number>(0);
const scrollTop = ref<number>(0);
// 列表数据版本号：整表重新拉取（page===1）时递增，用于让 v-memo 缓存失效，保证编辑后展示新数据
const listVersion = ref<number>(0);
const selectedIndex = ref<number>(0);
const userId = ref<number>(uni.getStorageSync('userId'));
const userType = ref<number>(uni.getStorageSync('usertype'));
const canSelect = ref<boolean>(hasPermission('project:Comment:select'));
const canInsert = ref<boolean>(hasPermission('project:Comment:insert'));
const canDelete = ref<boolean>(hasPermission('project:Comment:delete'));
const triggered = ref<boolean>(false);

// 日周月全部切换
const selectedType = ref<number>(1);
const selectDate = ref<number>(Number(getSystemDate(7, null)) < 18 ? Number(getSystemDate(5, null, -1)) : Number(getSystemDate(5, null)));
const selectWeek = ref<number>(Number(getSystemDate(5)));
const selectMonth = ref<number>(Number(getSystemDate(5)));

// 用户选择弹框
const userShow = ref<boolean>(false);
const userTriggered = ref<boolean>(false);
const userIdNameObj: Record<number, string> = {};

const dataForm = reactive<{
    page: number;
    limit: number;
}>({
    page: 1,
    limit: 20,
});

const model = reactive<{
    page: number;
    total: number;
    pid: number;
    fuzzy: string;
    prjName: string;
    prjDataList: any;
	username: string;
	userPage: number;
	userLimit: number;
	userTotal: number;
	userFuzzy: string;
	userDataList: any;
	deleteUserList: any;
	allUserDataList: any;
	checkedUser: any;
}>({
    page: 1,
    total: 0,
    pid: 0,
    fuzzy: '',
    prjName: '',
    prjDataList: [],
	username: '',
	userPage: 1,
	userLimit: 100,
	userTotal: 0,
	userFuzzy: '',
	userDataList: [],
	deleteUserList: [],
	allUserDataList: [],
	checkedUser: null
})

function handleClickLeft() {
    // #ifdef H5
    history.go(-1);
    // #endif

    // #ifndef H5
    uni.navigateBack();
    // #endif
}

// 打开弹出层
function handleLinkPrjShowChange() {
    prjShow.value = true;
}

// 清除
function handleClearFuzzyChange() {
	model.pid = 0;
	model.prjName = "";
    model.page = 1;
    getPrjDataList();
}

// 搜索
function handleSearchFuzzyChange() {
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
        const data = await fetchGetPrjDataList({ page: model.page, limit: 50, fuzzy: model.fuzzy });
        model.total = Number(data.total);
        model.prjDataList = model.prjDataList.concat(data.list);
        if (model.pid) {
            let prjIndex: number = model.prjDataList.findIndex((item: any) => item.id === Number(model.pid));
            model.prjDataList[prjIndex].disabled = true;
        }
    } catch (error) {
        console.error('获取项目分页数据失败', error);
    }
}

// 项目刷新
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
    // 获取对应名称
    const prjObj = model.prjDataList.find((item: any) => value === item.id);
    model.prjName = prjObj ? prjObj.proname : '';
    prjShow.value = false;
    dataForm.page = 1;
    selectedIndex.value = 0;
    getDataList();
}

// 清除
function handleClearChange() {
    model.pid = 0;
    model.prjName = "";
    dataForm.page = 1;
    selectedIndex.value = 0;
    getDataList();
}

// 搜索
function handleSearchChange() {
    dataForm.page = 1;
    selectedIndex.value = 0;
    getDataList();
}

// 日周月全部切换
const handleSelectedTypeChange = () => {
	dataForm.page = 1;
	getDataList();
}

// 日选择
function handleDateChange({ value }: { value: number }) {
	dataForm.page = 1;
	getDataList();
}

// 周选择
function handleWeekChange({ value }: { value: number }) {
	dataForm.page = 1;
	getDataList();
}

// 月选择
function handleMonthChange({ value }: { value: number }) {
	dataForm.page = 1;
	getDataList();
}

// 打开人员弹框
function handleLinkUserShowChange() {
    userShow.value = true;
}

// 清除
function handleClearUserFuzzyChange() {
    model.userDataList = model.allUserDataList;
}

// 搜索
function handleSearchUserFuzzyChange() {
    model.userDataList = model.allUserDataList.filter((item: any) => item.username.indexOf(model.userFuzzy) !== -1);
}

// 获取用户分页数据
async function getAlluserDataList() {
    if (!hasPermission('sys:user:get:list')) {
        return
    }
    try {
        if (model.userPage === 1) {
            model.userDataList = [];
            model.allUserDataList = [];
			model.deleteUserList = [];
        }
        const data = await fetchGetAllUserDataList({ page: model.userPage, limit: model.userLimit, usertypes: '2, 3, 9' });
        model.userTotal = Number(data.total);
        model.userDataList = model.userDataList.concat(data.list).filter((item: any) => item.status === 0);
        model.allUserDataList = model.allUserDataList.concat(data.list).filter((item: any) => item.status === 0);
		model.deleteUserList = model.deleteUserList.concat(data.list).filter((item: any) => item.status === 1);
        model.allUserDataList.forEach((item: any) => {
            userIdNameObj[item.id] = item.username;
        });
    } catch (error) {
        console.error('获取用户分页数据失败', error);
    }
}

// 刷新
function handleScrollUserRefreshChange() {
    userTriggered.value = true;
    model.userPage = 1;
    getAlluserDataList();
    setTimeout(() => {
        userTriggered.value = false;
        console.log('刷新完成');
    }, 1000)
}

// 滚动到底部
function handleScrolltolowerUserChange(e: any) {
    console.log('e', e);
    if (e.detail.direction === 'bottom' && model.allUserDataList.length + model.deleteUserList.length < model.userTotal) {
        model.userPage++;
        getAlluserDataList();
    }
}

// 关闭弹出层
function handleUserCloseChange() {
    userShow.value = false;
}

// 选择用户
function handleRadioSelectUserChange({ value }: { value: any }) {
    // const names = dataForm.checkedUser.map((id: any) => userIdNameObj[id]).filter(Boolean);
    // model.musers = names.join(", ");
    // model.musers = value.join(",");
	model.username = userIdNameObj[value];
	userShow.value = false;
	dataForm.page = 1;
	getDataList();
}

// 清除用户
function handleClearUserChange() {
	model.checkedUser = null;
	model.username = "";
	dataForm.page = 1;
	getDataList();
}

// 获取技术支持日报列表信息（在途保护：请求未返回时不叠加页码/不丢请求，避免触底加载跳页）
const listLoading = ref(false);
let pendingReload = false;

async function getDataList() {
    if (listLoading.value) {
        pendingReload = true;
        return;
    }
    listLoading.value = true;
    if (dataForm.page > 1) {
        state.value = 'loading'; // 触底翻页请求中，底部展示加载中
    }
    try {
        let queryParams: any = { page: dataForm.page, limit: dataForm.limit };
        if (model.pid) {
            queryParams['pid'] = model.pid;
        }
		if (selectedType.value === 1) {
		    queryParams['statrtTime'] = String(getSystemDate(0, selectDate.value) + ' 00:00:00');
			queryParams['endTime'] = String(getSystemDate(0, selectDate.value, 1) + ' 00:00:00');
		}
		if (selectedType.value === 2) {
			let datesArr = getCurrentWeekDates(selectWeek.value);
			queryParams['statrtTime'] = datesArr[0];
			queryParams['endTime'] = String(getSystemDate(0, new Date(datesArr[datesArr.length - 1]).getTime(), 1));
		}
		if (selectedType.value === 3) {
			const monthStr = getSystemDate(3, selectMonth.value);
			const startDate = `${monthStr}-01`;
			const endDate = getSystemDate(3, new Date(new Date(startDate).getFullYear(), new Date(startDate).getMonth() + 1));
			queryParams['statrtTime'] = startDate;
			queryParams['endTime'] = endDate + '-01';
		}
		if (model.username) {
			queryParams['creater'] = model.checkedUser;
		}
        const data = await fetchGetPrjdailyreportList(queryParams);
        const newList = data.list.map((item: any) => {
            let context = item.context;
            try {
                const parsed = JSON.parse(item.context);
                context = parsed;
            } catch (e) {
                // 不是合法 JSON，就保持原样
            }
			if (typeof context === 'string') {
				return {
				    ...item,
				    context,
				    commentList: [],
				    isObject: false,
				    isFold: item.hasOwnProperty('isFold') ? item.isFold : false,
				    content: item.hasOwnProperty('content') ? item.content : '',
				}
			} else {
				// 兼容 context 是多个对象组成的数组（补录多个项目）
				const projects = Array.isArray(context) ? context : [context];
				const projectList = projects.map((p: any, idx: number) => ({
				    proname: p && p.proname ? p.proname : '',
				    notes: p && p.notes ? String(p.notes).replace(/\n/g, '<br />') : '',
				    color: projectTagColors[idx % projectTagColors.length],
				}));
				return {
				    ...item,
				    proname: projectList[0].proname,
				    notes: projectList[0].notes,
				    projectList,
				    commentList: [],
				    isObject: true,
				    isFold: item.hasOwnProperty('isFold') ? item.isFold : false,
				    content: item.hasOwnProperty('content') ? item.content : '',
				}
			}
            // return {
            //     ...item,
            //     context,
            //     commentList: [],
            //     isObject: typeof context === 'string' ? false : true,
            //     isFold: item.hasOwnProperty('isFold') ? item.isFold : false,
            //     content: item.hasOwnProperty('content') ? item.content : '',
            // }
        });
        if (dataForm.page === 1) {
            listVersion.value++; // 整表重新拉取，失效所有卡片 v-memo 缓存，避免编辑后仍展示旧数据
            dataList.value = newList; // 整体替换，避免先清空导致页面高度塌缩、滚动位置回到顶部
        } else {
            dataList.value = dataList.value.concat(newList);
        }
        total.value = Number(data.total);
        if (dataList.value.length < total.value) {
            state.value = 'loadmore';
        } else {
            state.value = 'finished';
        }
    } catch (err) {
        console.error('获取技术支持日报列表失败', err);
        state.value = 'error';
    } finally {
        listLoading.value = false;
        if (pendingReload) {
            pendingReload = false;
            getDataList();
        }
    }
}

// 删除日报
async function handleDeleteChange(item: any, index: number) {
    console.log('item', item);
    console.log('index', index);
    try {
        message
        .confirm({
            msg: '确定要删除该日报吗?',
            title: '提示',
            confirmButtonProps: {
                type: 'error',
            },
        })
        .then(async () => {
            const data = await fetchDeletePrjdailyreportInfo(item.id);
            dataForm.page  = 1;
            getDataList();
        })
        .catch(() => {
            console.log('点击了取消按钮');
        });
    } catch (err) {
        console.error('删除日报失败', err);
    }
}

// 技术支持日报
function handleAddTechnicalsupportdailyChange(url: string) {
	if (clickLock.value) return;
	clickLock.value = true;
    uni.navigateTo({
        url,
		complete: () => {
			clickLock.value = false;
		}
    });
}

// 补录技术支持日报（不受时间窗限制，直接进入补录模式）
function handleMakeupChange() {
	if (clickLock.value) return;
	clickLock.value = true;
    uni.navigateTo({
        url: '/mePages/addtechnicalsupportdaily/Index?makeup=1',
		complete: () => {
			clickLock.value = false;
		}
    });
}

// 编辑技术支持日报（仅限本人 + 时间窗内）
function handleEditChange(item: any) {
	if (clickLock.value) return;
	clickLock.value = true;
    uni.navigateTo({
        url: '/mePages/addtechnicalsupportdaily/Index?id=' + item.id,
		complete: () => {
			clickLock.value = false;
		}
    });
}

// 评论日报
function handleCommentFoldChange(index: number) {
    selectedIndex.value = index;
    dataList.value.forEach((item: any, dataIndex: number) => {
        if (selectedIndex.value !== dataIndex) {
            item.isFold = false;
            item.content = "";
        }
    });
    dataList.value[index].isFold = !dataList.value[index].isFold;
    if (dataList.value[index].isFold) {
        handleGetCommentDataList();
    }
}

// 获取评论日报数据源
async function handleGetCommentDataList() {
    const data = await fetchGetDialyCommentDataList({ page: 1, limit: 100, pid: dataList.value[selectedIndex.value].id });
    dataList.value[selectedIndex.value].commentList = data.list;
}

// 评论日报提交
async function handleCommentSubmit() {
    if (!dataList.value[selectedIndex.value].content) {
        uni.showToast({
            icon: 'none',
            title: '请输入评论内容',
            duration: 1500
        })
        return
    }
    if (!hasPermission('project:Comment:insert')) {
        uni.showToast({
            icon: 'none',
            title: '暂无评论权限，请联系管理员',
            duration: 1500
        })
        return
    }
    const data = await fetchSaveDialyCommentInfo([{ pid: dataList.value[selectedIndex.value].id, context: dataList.value[selectedIndex.value].content }]);
    uni.showToast({
        title: '评论成功',
        icon: 'none',
        duration: 1500,
        complete: () => {
            // dataList.value[selectedIndex.value].isFold = false;
            dataList.value[selectedIndex.value].content = '';
            handleGetCommentDataList();
            dataList.value[selectedIndex.value].num++;
        }
    });
}

// 删除日报评论
async function handleDeleteCommentChange(id: number) {
    if (!hasPermission('project:Comment:delete')) {
        return
    }
    try {
        message
        .confirm({
            msg: '确定要删除该日报评论吗？',
            title: '提示',
            confirmButtonProps: {
                type: 'error',
            },
        })
        .then(async () => {
            const data = await fetchDeleteDialyCommentInfo(id);
            uni.showToast({
                icon: "none",
                title: "删除日报评论成功",
                duration: 1500,
                complete: () => {
                    // dataForm.page = 1;
                    // getDataList();
                    handleGetCommentDataList();
                    if (dataList.value[selectedIndex.value].num > 0) {
                        dataList.value[selectedIndex.value].num--;
                    }
                }
            })
        })
        .catch(() => {
            console.log('点击了取消按钮');
        });
    } catch (error) {
        console.error('删除日报评论失败', error);
    }
}

// 页面跳转
function handleJumpPageChange(url: string) {
	if (clickLock.value) return;
	clickLock.value = true;
    uni.navigateTo({
        url,
		complete: () => {
			clickLock.value = false;
		}
    })
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

// 多次重测顶部高度：wd 组件、权限按钮等可能异步渲染，单次测量易偏小，导致列表首项被固定头部遮挡
function scheduleRecalcTopFixedHeight() {
    [0, 120, 300, 600, 1000].forEach((ms) => {
        setTimeout(() => recalcTopFixedHeight(), ms);
    });
}

// 刷新列表：回到第一页重新拉取，保证新增/编辑后的数据完整展示
function refreshDailyList() {
    dataForm.page = 1;
    getDataList();
}

onLoad(async(options: any) => {
    model.pid = options.pid;
	model.fuzzy = options.pname ? decodeURIComponent(options.pname) : '';
	// 概览「日报数」跳转带 type=4 时默认勾选「全部」
	if (options.type&&options.pid) {
    model.pid = options.pid;
    model.prjName = options.pname ? decodeURIComponent(options.pname) : '';
		selectedType.value = Number(options.type);
	}
	await getPrjDataList();
	if (userType.value !== 3) {
		await getAlluserDataList();
	}
	await getDataList();
    uni.$on('refreshListPrjDaily', refreshDailyList); // 监听刷新事件
});

onReady(() => {
    scheduleRecalcTopFixedHeight();
})

onUnload(() => {
    uni.$off('refreshListPrjDaily', refreshDailyList); // 页面销毁时解绑
});

onPageScroll((e) => {
    scrollTop.value = e.scrollTop;
});

onPullDownRefresh(() => {
    dataForm.page = 1;
    getDataList();
    setTimeout(() => {
        uni.hideNavigationBarLoading(); // 完成停止加载
        uni.stopPullDownRefresh();
    }, 1000);
});

onReachBottom(() => {
    if (listLoading.value) {
        // 请求仍在途：不翻页，底部展示加载中
        state.value = 'loading';
        return;
    }
    if (dataList.value.length < total.value) {
        dataForm.page++;
        getDataList();
    } else if (dataList.value.length === total.value) {
        state.value = 'finished';
    }
});

// onMounted 再次确保计算一次（兼容 H5）
onMounted(() => {
    nextTick(() => {
        scheduleRecalcTopFixedHeight();
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

        <view class="topFixedWrap" :style="{ backgroundColor: isDark ? '#323233' : '#FFFFFF' }">
            <wd-navbar left-arrow title="技术支持日报列表" safe-area-inset-top placeholder :bordered="false" @click-left="handleClickLeft">
                <template #right v-if="hasPermission('project:Info:select')">
                    <wd-icon name="filter" @click.stop="handleLinkPrjShowChange"></wd-icon>
                </template>
            </wd-navbar>

            <view class="prjSearchWrap">
            <wd-search v-model="model.prjName" disabled placeholder="请选择项目" :placeholderClass="isDark ? 'whiteClass' : 'greyClass'" placeholder-left cancel-txt="搜索" @search="handleSearchChange" @cancel="handleSearchChange" @clear="handleClearChange" />
            <view class="prjSearchMask" @click="handleLinkPrjShowChange"></view>
            </view>

			<view v-if="userType !== 3" :style="{ background: isDark ? '#1b1b1b' : '#ffffff', padding: '10rpx 20rpx', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0 10rpx' }">
				<wd-input clearable disabled no-border v-model="model.username" placeholder="请选择用户" custom-style="width: calc(100vw - 40rpx)">
					<template #suffix>
						<wd-button icon="link" size="small" @click.stop="handleLinkUserShowChange">用户信息</wd-button>
					</template>
				</wd-input>
				
				<wd-icon v-if="model.username" size="30rpx" name="close-circle" @click.stop="handleClearUserChange"></wd-icon>
			</view>
			<view class="canvasHeader" :style="{ padding: '20rpx', width: 'calc(100vw - 40rpx)', background: isDark ? '#000000' : '#ffffff' }">
			    <wd-radio-group size="small" v-model="selectedType" shape="button" @change="handleSelectedTypeChange">
			        <wd-radio :value="1">日</wd-radio>
			        <wd-radio :value="2">周</wd-radio>
			        <wd-radio :value="3">月</wd-radio>
			        <wd-radio :value="4">全部</wd-radio>
			    </wd-radio-group>
			
			    <wd-datetime-picker v-if="selectedType === 1" type="date" v-model="selectDate" @confirm="handleDateChange" />
				<wd-calendar v-if="selectedType === 2" type="week" v-model="selectWeek" @confirm="handleWeekChange" />
			    <wd-datetime-picker v-if="selectedType === 3" type="year-month" v-model="selectMonth" @confirm="handleMonthChange" />
			</view>
			<view class="dailyTimeNoticeWrap" :style="{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: isDark ? '#1b1b1b' : '#ffffff', padding: '10rpx 20rpx' }">
				<view style="flex: 1; min-width: 0; display: flex; flex-wrap: wrap; align-items: center;">
					<text :style="{ fontSize: '24rpx', color: isDark ? '#6ea1ff' : '#0055FE' }">日报新增或编辑时间：每日 17:30 – 次日 04:59</text>
					<text :style="{ fontSize: '24rpx', color: canAddOrEdit ? '#52c41a' : '#ff4d4f' }">{{ canAddOrEdit ? '（当前可新增或编辑）' : '（当前不可新增或编辑）' }}</text>
				</view>
				<view style="display: flex; align-items: center; gap: 10rpx;">
					<wd-button type="primary" v-if="canAddOrEdit && hasPermission('project:DailyReport:insert')" size="small" :disabled="clickLock" @click="handleAddTechnicalsupportdailyChange('/mePages/addtechnicalsupportdaily/Index')">新增</wd-button>
					<wd-button type="warning" v-if="hasPermission('project:DailyReport:insert')" size="small" :disabled="clickLock" @click="handleMakeupChange">补录</wd-button>
				</view>
			</view>
            <!-- <wd-search v-model="dataForm.username" custom-class="wdSearchContainer" placeholder="请输入技术支持日报内容" :placeholderClass="isDark ? 'whiteClass' : 'greyClass'" placeholder-left cancel-txt="搜索" @click="handleLinkPrjShowChange" @search="handleSearchChange" @cancel="handleSearchChange" @clear="handleClearChange" /> -->
            <view class="summary-bar" :style="{ background: isDark ? '#1b1b1b' : '#ffffff' }">
                <view class="summary-chip" :style="{ background: isDark ? '#1b1b1b' : 'var(--wd-bg-color-grey, #f7f8fa)' }">
                    <text class="summary-dot"></text>
                    <text class="summary-text" :style="{color: isDark ? '#ffffff' : '#4e5969'}">已加载 <text class="summary-num">{{ dataList.length }}</text> / 共 <text class="summary-num">{{ total }}</text> 条</text>
                </view>
            </view>
        </view>

        <view v-if="dataList.length > 0">
            <view v-for="(dataItem, index) in dataList" :key="index" v-memo="[listVersion, dataItem.id, dataItem.isFold, dataItem.num, dataItem.commentList, dataItem.reportcon]" :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 80rpx)', margin: '20rpx', borderRadius: '20rpx', padding: '20rpx' }">
            <view @click="handleJumpPageChange('/mePages/dailyreportinfo/Index?id=' + dataItem.id)">
				<view class="prjInfoHeader">
					<view class="left">
						<wd-text bold :text="dataItem.username + '的技术支持日报'" size="14px" :lines="1" :color="isDark ? '#ffffff' : '#000000'" />
						<view class="dailyTimeInfo">
							<text class="dailyTimeText">填报日期：{{ formatDbtime(dataItem.dbtime) }}</text>
							<text class="dailyTimeText">更新时间：{{ dataItem.updbtime }}</text>
						</view>
					</view>
					<view v-if="isMakeupReport(dataItem)" style="display: flex; align-items: center; flex-shrink: 0;">
						<view class="makeupTag">补录</view>
					</view>
          <view class="statusTag" :class="dataItem.status === 1 ? 'statusSubmitted' : 'statusUnsubmitted'">{{ dataItem.status === 1 ? '已提交' : '未提交' }}</view>
				</view>
				<view v-if="!dataItem.isObject">
					<view style="margin-top: 20rpx; font-size: 28rpx;">当天工作内容及成果描述:</view>
					<view style="margin: 10rpx 0; font-size: 28rpx; font-weight: bolder;">{{ dataItem.context }}</view>
				</view>
				<view v-else>
					<view style="margin-top: 20rpx; font-size: 28rpx;">项目名称:</view>
					<view style="margin: 10rpx 0; display: flex; flex-wrap: wrap; gap: 10rpx;">
						<view v-for="(pj, pidx) in dataItem.projectList" :key="pidx" :style="{ background: pj.color + '1A', color: pj.color, border: '1rpx solid ' + pj.color + '33', borderRadius: '10rpx', padding: '4rpx 16rpx', fontSize: '26rpx', fontWeight: 'bolder' }">{{ pj.proname || '未绑定项目' }}</view>
					</view>
					<view style="margin: 10rpx 0; font-size: 28rpx;">当天工作内容及成果描述:</view>
					<template v-if="dataItem.projectList.length > 1" >
						<view v-for="(pj, pidx) in dataItem.projectList" :key="pidx" style="margin: 10rpx 0;" class="fieldValuePanel">
							<view :style="{ fontSize: '28rpx', fontWeight: 'bolder', color: '#000' }">项目： {{ pj.proname || '无' }}</view>
							<view v-if="pj.notes" style="font-size: 28rpx; margin-top: 4rpx;" v-html="pj.notes"></view>
						</view>
					</template>
					<template v-else>
						<view v-if="dataItem.projectList[0] && dataItem.projectList[0].notes" class="fieldValuePanel" style="margin: 10rpx 0; font-size: 28rpx;" v-html="dataItem.projectList[0].notes"></view>
					</template>
				</view>
				<view v-if="dataItem.charctras" style="margin-top: 20rpx; font-size: 28rpx;">字符数:</view>
				<view v-if="dataItem.charctras" style="margin: 10rpx 0; font-size: 28rpx; font-weight: bolder;">{{ dataItem.charctras }}</view>
				<!-- 日报图片入口（仿 web 端图片列：点击进图片弹窗，带数量角标） -->
				<view class="imgEntryRow" @click.stop="openImages(dataItem, false)">
					<wd-icon name="picture" size="18px" color="#1677ff"></wd-icon>
					<text class="imgEntryText">日报图片</text>
					<view v-if="parseReportCons(dataItem).length > 0" class="imgCountBadge">{{ parseReportCons(dataItem).length }}</view>
					<wd-icon name="arrow-right" size="14px" color="#999" custom-style="margin-left: auto;"></wd-icon>
				</view>
				<!-- 阶段实施成果（仅管理员 usertype=0 / 审核 usertype=2 可见，仿 web 端列） -->
				<view v-if="userType === 0 || userType === 2 || userType === 4" style="margin-top: 10rpx;" @click.stop>
					<view style="font-size: 28rpx;">阶段实施成果:</view>
					<view v-if="parseReportCons(dataItem).length === 0" style="margin: 6rpx 0; font-size: 26rpx; color: #999;">-</view>
					<view v-for="(img, imgIdx) in parseReportCons(dataItem)" :key="imgIdx" class="reportConItem" @click.stop="showReportText(dataItem, imgIdx, img.content)">{{ imgIdx + 1 }}. {{ img.content || '（未识别）' }}</view>
				</view>
</view>

				<!-- 操作行：左侧 编辑/删除（仅限本人且在时间窗内），右侧 评论 -->
				<view style="padding: 20rpx;" v-if="canSelect || (canAddOrEdit && userId === dataItem.creater)">
					<view style="height: 20rpx;"></view>
					<wd-gap bg-color="#cccccc" height="2rpx"></wd-gap>
					<view style="display: flex; justify-content: space-between; align-items: center; margin-top: 10rpx;">
						<!-- 编辑/删除：仅限本人（userId === creater）且在时间窗内 -->
						<view v-if="(canAddOrEdit) && userId === dataItem.creater" style="display: flex; align-items: center; gap: 10rpx;" @click.stop>
							<wd-button size="small" type="primary" plain  @click.stop="handleEditChange(dataItem)">编辑</wd-button>
							<wd-button size="small" type="error" plain @click.stop="handleDeleteChange(dataItem, index)">删除</wd-button>
						</view>
            <view v-else style="width: 60px;"></view>
						<view v-if="canSelect" style="width: 60px; padding: 5rpx; border-radius: 50rpx; border: 2rpx solid #ccc; text-align: center; display: flex; justify-content: center; align-items: center;" @click.stop="handleCommentFoldChange(index)">
							<image class="content-top" style="width: 24px; height: 24px;" :src="isDark ? '../../static/commentswhite.png' : '../../static/comments.png'" />
							<wd-text bold :text=" '(' + dataItem.num + ')'" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
						</view>
					</view>

					<view v-if="dataItem.isFold" @click.stop>
						<view style="height: 10rpx;"></view>
						<wd-steps :active="dataItem.commentList.length" vertical dot>
							<view v-for="(commentItem, commentIndex) in dataItem.commentList" :key="commentIndex" style="display: flex; justify-content: space-between; align-items: flex-start;">
								<wd-step :description="commentItem.context">
									<template #title>
										<view style="display: flex; align-items: baseline; flex-wrap: wrap;">
											<text>{{ commentItem.username }}</text>
											<text class="commentTimeText">{{ commentItem.dbtime }}</text>
										</view>
									</template>
								</wd-step>
								<wd-icon name="delete1" size="22px" color="#ff0000" v-if="canDelete && (userType === 0 || userId === commentItem.creater)" @click="handleDeleteCommentChange(commentItem.id)"></wd-icon>
							</view>
						</wd-steps>
						<wd-textarea v-if="canInsert" type="textarea" prop="summarize" clearable no-border auto-height v-model="dataItem.content" :placeholder="'评论' + dataItem.username + '的技术支持日报'" />
						<view class="footer" v-if="canInsert">
							<wd-button type="primary" size="small" @click="handleCommentSubmit" block>提交</wd-button>
						</view>
					</view>
				</view>
            </view>

            <wd-loadmore :state="state" loading-text="正在加载内容" @reload="getDataList" />

            <wd-backtop :bottom="110" :scrollTop="scrollTop" customStyle="background: #007aff; color:white;"></wd-backtop>
        </view>

        <view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff', height: 'calc(100vh - 400rpx)' }">
            <wd-status-tip image="../../static/search.png" tip="暂无技术支持日报" />
        </view>

        <wd-popup closable z-index="100" :custom-style="`width: 90vw; height: 100vh; display: flex; flex-direction: column;`" custom-class="popupWrap" v-model="prjShow" position="left" @close="handleCloseChange">
            <wd-gap height="70rpx" />

            <wd-search v-model="model.fuzzy" placeholder="请输入项目名称" placeholder-left cancel-txt="搜索" @search="handleSearchFuzzyChange" @cancel="handleSearchFuzzyChange" @clear="handleClearFuzzyChange" />

            <scroll-view scroll-y refresher-enabled :refresher-triggered="triggered" @refresherrefresh="handleScrollRefreshChange" @scrolltolower="handleScrolltolowerChange" style="flex: 1; min-height: 0;">
                <wd-radio-group v-model="model.pid" shape="dot" @change="handleCheckboxSelectChange">
                    <wd-radio v-for="(item, index) in model.prjDataList" :key="index" :value="item.id" class="radioCellWrap">{{ item.proname }}</wd-radio>
                </wd-radio-group>
            </scroll-view>
        </wd-popup>
		
		<wd-popup closable z-index="100" :custom-style="`width: 90vw; height: 100vh; display: flex; flex-direction: column;`" custom-class="popupWrap" v-model="userShow" position="left" @close="handleUserCloseChange">
		    <wd-gap height="70rpx" />
		
		    <wd-search v-model="model.userFuzzy" placeholder="请输入用户名称" placeholder-left cancel-txt="搜索" @search="handleSearchUserFuzzyChange" @cancel="handleSearchUserFuzzyChange" @clear="handleClearUserFuzzyChange" />
		
		    <scroll-view scroll-y refresher-enabled :refresher-triggered="userTriggered" @refresherrefresh="handleScrollUserRefreshChange" @scrolltolower="handleScrolltolowerUserChange" style="flex: 1; min-height: 0;">
		        <wd-radio-group v-model="model.checkedUser" shape="dot" @change="handleRadioSelectUserChange">
		            <wd-radio v-for="(item, index) in model.userDataList" :key="index" :value="item.id" class="radioCellWrap">{{ item.username }}</wd-radio>
		        </wd-radio-group>
		    </scroll-view>
		</wd-popup>

		<!-- 日报图片弹窗（查看/上传/删除） -->
		<DailyImagePopup v-model="imageVisible" :pid="imagePid"  :can-edit="imageCanEdit" :username="imageUsername" :dbtime="imageDbtime" @submitted="refreshDailyList" />

		<!-- 阶段实施成果（图片识别内容审                                                                                                                                            核，usertype 0/2） -->
		<DailyImageTextPopup v-model="textVisible" :pid="textPid"  :reportcon="textReportcon" :username="textUsername" :dbtime="textDbtime" @submitted="refreshDailyList" />
    </wd-config-provider>
</template>

<style lang="scss" scoped>
.topFixedWrap {
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    z-index: 99;
    background-color: #FFFFFF;
    // 保证内联元素正确换行
    box-sizing: border-box;
    // 可选：微阴影让固定区更明显
    // box-shadow: 0 1px 6px rgba(0,0,0,0.06);
}

/* 已加载/总数统计条（与主站调度统一样式） */
.summary-bar {
    padding: 10rpx 24rpx 14rpx;
}

.summary-chip {
    display: inline-flex;
    align-items: center;
    gap: 10rpx;
    padding: 8rpx 20rpx;
    border-radius: 999rpx;
    background: #f7f8fa;
    border: 1rpx solid #f0f1f3;
    font-size: 24rpx;
    color: #4e5969;
}

.summary-dot {
    width: 12rpx;
    height: 12rpx;
    border-radius: 50%;
    background: linear-gradient(135deg, #1677ff 0%, #69b1ff 100%);
}

.summary-num {
    font-weight: 600;
    color: #1677ff;
    margin: 0 4rpx;
}

.prjSearchWrap {
    position: relative;
}

.prjSearchMask {
    position: absolute;
    left: 0;
    top: 0;
    right: 200rpx;
    bottom: 0;
    z-index: 10;
}

.footer {
    margin-top: 40rpx;
}
/* 内容值内嵌面板，与 label 区分 */
.fieldValuePanel {
    margin-top: 10rpx;
    font-size: 26rpx;
    line-height: 1.6;
    padding: 12rpx 16rpx;
    border-radius: 10rpx;
    background: rgba(128, 128, 128, 0.12);
    word-break: break-all;
}
.prjInfoHeader {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;

    .left{
        flex: 1;
        min-width: 0;
    }
}

.makeupTag {
    flex-shrink: 0;
    margin-left: 10rpx;
    padding: 2rpx 14rpx;
    font-size: 22rpx;
    line-height: 1.6;
    color: #ffffff;
    background: #ff9900;
    border-radius: 8rpx;
}

.statusTag {
    flex-shrink: 0;
    margin-left: 10rpx;
    padding: 2rpx 14rpx;
    font-size: 22rpx;
    line-height: 1.6;
    color: #ffffff;
    border-radius: 8rpx;
}
.statusSubmitted {
    background: #52c41a;
}
.statusUnsubmitted {
    background: #fa541c;
}

.commentTimeText {
    margin-left: 12rpx;
    font-size: 22rpx;
    color: v-bind("isDark ? '#8a8a8a' : '#999999'");
}

/* 日报图片入口行 */
.imgEntryRow {
    display: flex;
    align-items: center;
    gap: 12rpx;
    margin-top: 20rpx;
    padding: 16rpx 20rpx;
    font-size: 28rpx;
    background: v-bind("isDark ? '#242424' : '#f5f5f5'");
    border-radius: 12rpx;
}

.imgEntryText {
    color: v-bind("isDark ? '#e0e0e0' : '#333333'");
}

.imgCountBadge {
    min-width: 36rpx;
    height: 36rpx;
    line-height: 36rpx;
    text-align: center;
    padding: 0 8rpx;
    font-size: 22rpx;
    color: #ffffff;
    background: #1677ff;
    border-radius: 18rpx;
}

.reportConItem {
    margin: 6rpx 0;
    font-size: 26rpx;
    color: #1677ff;
    line-height: 1.6;
    /* 每条最多展示 3 行，超出省略号截断 */
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    overflow: hidden;
    text-overflow: ellipsis;
    word-break: break-all;
}

.dailyTimeInfo {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0 20rpx;
    margin-top: 6rpx;

    .dailyTimeText {
        font-size: 24rpx;
        color: v-bind("isDark ? '#8a8a8a' : '#999999'");
    }
}

.radioCellWrap {
    padding: 10rpx 20rpx !important;
}

:deep(.wd-step) {
    width: calc(100% - 44rpx) !important;
}

// :deep(.wd-step__description) {
//     width: calc(100% - 40rpx) !important;
//     word-wrap: break-word !important;
// }

:deep(.wd-step__description) {
    word-wrap: break-word !important;
    width: calc(100vw - 260rpx) !important;
}

:deep(.wd-radio__label) {
    text-align: left !important;
    width: calc(100% - 80rpx) !important;
}

.canvasHeader {
    display: flex;
    justify-content: space-between;
    align-items: center;
	
	:deep(.wd-radio__label) {
		text-align: center !important;
	}
	
	:deep(.wd-cell__wrapper) {
		padding: 0 !important;
	}
}

:deep(.wd-radio) {
    margin-right: 0 !important;
}

:deep(.wd-radio.is-button .wd-radio__label) {
    width: 40px !important;
    height: 30px !important;
    line-height: 30px !important;
    padding: 0 !important;
    border-radius: 0 !important;
    min-width: 40px !important;
    margin: 0 !important;
}

:deep(.wd-radio-group) {
    background-color: v-bind("isDark ? '#000000' : '#ffffff'") !important;
}

:deep(.wd-datetime-picker__cell) {
	background: transparent !important;
}
</style>
