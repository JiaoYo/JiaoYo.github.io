<script setup lang="ts">
import { throttle } from '@/utils/debounce';
import { reactive, ref, onMounted, computed, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { useMessage } from 'wot-design-uni';
import { globalData } from '@/utils/global';
import { getSystemDate, hasPermission, wgs84ToGcj02 } from '@/utils/index';
import { useTabbar } from '@/composables/useTabbar';
import { onReady, onLoad, onShow, onUnload, onPageScroll, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import { fetchGetAllUserDataList, fetchGetSystemHomePageInfo, fetchGetPrjDataList, fetchDeletePrjInfo, fetchUpdatePrjInfo, fetchGetPrjHomePageInfo, fetchSavePrjClockinInfo, fetchGetProvinceInfo, fetchGetCityInfo, fetchGetPrjInfo, fetchGetPrjMemberDataList, fetchGetDebugEquipmentDataList, fetchGetDebugBusinessDataList, fetchGetContractsDevicesPageByPrjId } from '@/service/index';
import uniSwipeAction from '@/components/uni-swipe-action/components/uni-swipe-action/uni-swipe-action.vue';
import uniSwipeActionItem from '@/components/uni-swipe-action/components/uni-swipe-action-item/uni-swipe-action-item.vue';
// #ifdef APP || APP-PLUS
import { startServe } from "@/uni_modules/Lin97112479-location"
import { getLocations,clearLocations,getGps,setGps,getLocation,preciseLocation,setTings,getBattery,setBattery} from "@/uni_modules/Lin97112479-location/utssdk/index.js"
// #endif

const { activeTabbar, getTabbarItemValue, setTabbarItemActive, tabbarList } = useTabbar();

const { t } = useI18n();

const { theme } = useTheme();

const message = useMessage();

const isDark = computed(() => theme.value === 'dark');

const topFixedHeight = ref<number>(0);
const scrollViewHeight = ref<number>(0);
const topFixedWrap = ref<any>(null);
const fixedScrollTop = ref<number>(0);
const allowScrollLoad = ref<boolean>(true);

const recentDataList = ref<any[]>([]);
const dataList = ref<any[]>([]);
const notApprovedList = ref<any[]>([]);
const noStartDataList = ref<any[]>([]);
const progressingDataList = ref<any[]>([]);
const auditDataList = ref<any[]>([]);
const completeDataList = ref<any[]>([]);
const scrollTop = ref<number>(0);
const activePrjTab = ref<number>(0);
const activeTab = ref<number>(0);
const userId = ref<string>(uni.getStorageSync('userId'));
const userType = ref<number>(uni.getStorageSync('usertype'));
const ptype = ref<number>(-1);
const debugType = ref<number>(-1);
const rangeTime = ref<any[]>([]);
const dropMenuRef = ref();
const loading = ref<boolean>(false);
const tabsPrjList = ref<{ title: string, value: number }[]>([
    {
        title: '近期项目',
        value: 0
    },
    {
        title: '项目列表',
        value: 1
    }
]);

const tabsList = ref<{ title: string, count: number, value: number }[]>([
    {
        title: '全部',
        count: 0,
        value: -100
    },
    {
        title: '未核准',
        count: 0,
        value: -1
    },
    {
        title: '未开始',
        count: 0,
        value: 0
    },
    {
        title: '进行中',
        count: 0,
        value: 1
    },
    {
        title: '待审核',
        count: 0,
        value: 2
    },
    {
        title: '已完成',
        count: 0,
        value: 3
    }
]);

const options = ref<any>(hasPermission('project:Info:delete') ? [
    {
        text: '删除',
        style: {
            backgroundColor: '#dd524d'
        }
    }
] : []);

// 省份、地区
const provinceInfo = reactive({
    provinceData: [] as any,
    regionData: [] as any,
    selectProvince: -1,
    selectRegion: [] as any,
    selectRegionType: 2,
})

// 参与人
const userShow = ref<boolean>(false);
const userTriggered = ref<boolean>(false);
const userDataList = ref<any>([]);
const allUserDataList = ref<any>([]);

const dataForm = reactive<{
	recentPage: number;
	recentTotal: number;
	recentState: string;
    page: number;
    limit: number;
    total: number;
    state: string;
    notApprovedPage: number;
    notApprovedTotal: number;
    notApprovedState: string;
    noStartPage: number;
    noStartTotal: number;
    noStartState: string;
    progressingPage: number;
    progressingTotal: number;
    progressingState: string;
    auditPage: number;
    auditTotal: number;
    auditState: string;
    completePage: number;
    completeTotal: number;
    completeState: string;
    fuzzy: string;
	userPage: number;
	userLimit: number;
	userTotal: number;
	participantFuzzy: string;
	participant: any;
	participantname: string;
}>({
	recentPage: 1,
	recentTotal: 0,
	recentState: 'loading',
    page: 1,
    limit: 20,
    total: 0,
    state: 'loading',
    notApprovedPage: 1,
    notApprovedTotal: 0,
    notApprovedState: 'loading',
    noStartPage: 1,
    noStartTotal: 0,
    noStartState: 'loading',
    progressingPage: 1,
    progressingTotal: 0,
    progressingState: 'loading',
    auditPage: 1,
    auditTotal: 0,
    auditState: 'loading',
    completePage: 1,
    completeTotal: 0,
    completeState: 'loading',
    fuzzy: '',
	userPage: 1,
	userLimit: 100,
	userTotal: 0,
	participantFuzzy: '',
	participant: null,
	participantname: ''
});

/** ========= 表格数据（示例） ========= */
const reportData = reactive([
    { label: '计划调试时间', value: '' },
    { label: '项目名称/调度名称', value: '' },
    { label: '项目地址', value: '' },
    { label: '调试方式', value: '' },
	{ label: '调试人员', value: '' },
    { label: '联系人/联系方式', value: [] },
	{ label: '调试内容', value: '' },
    { label: '站内设备清单', value: [] }
])

/* ================= Canvas 尺寸 ================= */
const canvasWidth = ref(1600);
const canvasHeight = ref(0);

/* ================= 样式常量 ================= */
const padding = 20;
const titleHeight = 80; // 标题高度
const labelWidth = 200;
const valueWidth = 1350;
const rowMinHeight = 60;
const fontSize = 22;
const titleFontSize = 26; // 标题字体大小
const lineHeight = 32;
const subTablePaddingTop = 10; // 子表格上边距
const subTablePaddingBottom = 10; // 子表格下边距

/* ================= 辅助：计算单个单元格文本所需高度（更准确） ================= */
function getTextHeight(ctx: any, text: string, maxWidth: number): number {
    if (!text) return lineHeight;

    const lines = (text || '').split('\n');
    let totalHeight = 0;

    for (const line of lines) {
        if (line === '') {
            totalHeight += lineHeight;
            continue;
        }

        let currentLine = '';
        let lineCount = 0;
        const chars = line.split(''); // 逐字符处理中文

        for (let i = 0; i < chars.length; i++) {
            const testLine = currentLine + chars[i];
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && currentLine !== '') {
                lineCount++;
                currentLine = chars[i];
            } else {
                currentLine = testLine;
            }
        }
        lineCount++; // 最后一行
        totalHeight += lineCount * lineHeight;
    }

    return totalHeight;
}

/* ================= 自动换行绘制（左对齐，顶部对齐）================= */
function drawTextWrapLeft(ctx: any, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
    if (!text) return y;

    const lines = (text || '').split('\n');
    let currentY = y;

    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.setFillStyle('#000');

    for (const line of lines) {
        if (line === '') {
            currentY += lineHeight;
            continue;
        }

        let current = '';
        for (let i = 0; i < line.length; i++) {
            const test = current + line[i];
            if (ctx.measureText(test).width > maxWidth) {
                ctx.fillText(current, x, currentY);
                currentY += lineHeight;
                current = line[i];
            } else {
                current = test;
            }
        }
        ctx.fillText(current, x, currentY);
        currentY += lineHeight;
    }

    return currentY;
}

/* ================= 绘制子表格 ================= */
function drawSubTable(subTableCols: any[], ctx: any, data: any[], x: number, y: number) {
    const rowHeight = 50;
    let curY = y;

    ctx.setLineWidth(1);
    ctx.setStrokeStyle('#000');
    ctx.setFontSize(fontSize);

    // 表头
    let headerX = x;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const col of subTableCols) {
        // 背景（使用 #FAFAFC）
        ctx.setFillStyle('#FAFAFC');
        ctx.fillRect(headerX, curY, col.width, rowHeight);
        // 边框
        ctx.strokeRect(headerX, curY, col.width, rowHeight);
        // 文字
        ctx.setFillStyle('#000');
        ctx.fillText(col.title, headerX + col.width / 2, curY + rowHeight / 2);
        headerX += col.width;
    }

    curY += rowHeight;

    // 表体
    for (const row of data) {
        let cellX = x;
        for (const col of subTableCols) {
            // 白色背景
            ctx.setFillStyle('#fff');
            ctx.fillRect(cellX, curY, col.width, rowHeight);
            // 边框
            ctx.strokeRect(cellX, curY, col.width, rowHeight);
            // 文字（居中）
            ctx.setFillStyle('#000');
            const text = String(row[col.key] ?? '');
            ctx.fillText(text, cellX + col.width / 2, curY + rowHeight / 2);
            cellX += col.width;
        }
        curY += rowHeight;
    }

    return curY - y;
}

/* ================= 绘制标题 ================= */
function drawTitle(ctx: any) {
    // 先绘制白色背景
    ctx.setFillStyle('#FFFFFF');
    ctx.fillRect(padding, padding, canvasWidth.value - padding * 2 - 8, titleHeight);

    // 可选：绘制标题区域边框
    ctx.setStrokeStyle('#000');
    ctx.setLineWidth(1);
    ctx.strokeRect(padding, padding, canvasWidth.value - padding * 2 - 8, titleHeight);

    // 绘制标题文字
    ctx.setFontSize(titleFontSize);
    ctx.setTextAlign('center');
    ctx.setTextBaseline('middle');
    ctx.setFillStyle('#000');

    // 绘制标题文字（居中在标题区域内）
    const titleX = padding + (canvasWidth.value - padding * 2) / 2;
    const titleY = padding + titleHeight / 2;

    // 第一次绘制（轻微偏移，模拟加粗）
    ctx.fillText('工程调试确认单', titleX, titleY);

    // 恢复默认字体大小
    ctx.setFontSize(fontSize);
}

/* ================= 正式绘制报告（关键修改在 value 非数组部分） ================= */
function drawReport() {
    const ctx: any = uni.createCanvasContext('reportCanvas');

    ctx.setFontSize(fontSize);
    ctx.setStrokeStyle('#000');
    ctx.setFillStyle('#000');
    ctx.setLineWidth(1);

    // 先计算总高度
    let totalHeight = padding + titleHeight;
    const maxWidthForValue = valueWidth - 20;

    ctx.setFontSize(fontSize); // 确保测量字体一致

    const rowHeights: number[] = [];

    for (let i = 0; i < reportData.length; i++) {
        const item = reportData[i];

        if (Array.isArray(item.value)) {
            // 子表格处理（保持不变）
            const subTableCols = i === 5 ? [
                { key: 'docker', title: '对接方', width: 250 },
                { key: 'pname', title: '姓名', width: 150 },
                { key: 'pcontact', title: '联系方式', width: 240 }
            ] : [
                { key: 'devname', title: '设备名称', width: 220 },
                { key: 'outInventoryStatus', title: '是否出库', width: 120 },
                { key: 'install', title: '设备是否安装就位', width: 180 },
                { key: 'connectionmode', title: '设备通信接线方式', width: 260 },
                { key: 'devstatus', title: '设备状态', width: 150 },
                { key: 'manucontact', title: '厂家联系人', width: 180 },
                { key: 'manuinfo', title: '厂家联系方式', width: 200 }
            ];

            const subTableHeight = 50 * (item.value.length + 1) + subTablePaddingTop + subTablePaddingBottom;
            const rowHeight = Math.max(rowMinHeight, subTableHeight);
            rowHeights.push(rowHeight);
            totalHeight += rowHeight;
        } else {
            // 🔥 关键修复：使用精确高度，不再受 rowMinHeight 限制（除非你仍希望最小高度）
            const textH = getTextHeight(ctx, item.value, maxWidthForValue);
            const rowHeight = Math.max(rowMinHeight, textH); // 可保留最小高度，但通常 textH 更大
            rowHeights.push(rowHeight);
            totalHeight += rowHeight;
        }
    }

    totalHeight += padding;
    canvasHeight.value = totalHeight;
    console.log('Canvas总高度:', totalHeight, '各行列高:', rowHeights);

    // 开始绘制
    let y = padding;
    drawTitle(ctx);
    y += titleHeight;

    for (let i = 0; i < reportData.length; i++) {
        const item = reportData[i];
        const rowHeight = rowHeights[i];

        // 绘制 label（左侧）
        ctx.setFillStyle('#FAFAFC');
        ctx.fillRect(padding, y, labelWidth, rowHeight);
        ctx.strokeRect(padding, y, labelWidth, rowHeight);
        ctx.setFillStyle('#000');
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.label, padding + 10, y + rowHeight / 2);

        // 绘制 value（右侧）
        ctx.setFillStyle('#fff');
        ctx.fillRect(padding + labelWidth, y, valueWidth, rowHeight);
        ctx.strokeRect(padding + labelWidth, y, valueWidth, rowHeight);

        if (Array.isArray(item.value)) {
            // 子表格（保持不变）
            const subTableCols = i === 5 ? [
                { key: 'docker', title: '对接方', width: 250 },
                { key: 'pname', title: '姓名', width: 150 },
                { key: 'pcontact', title: '联系方式', width: 240 }
            ] : [
                { key: 'devname', title: '设备名称', width: 220 },
                { key: 'outInventoryStatus', title: '是否出库', width: 120 },
                { key: 'install', title: '设备是否安装就位', width: 180 },
                { key: 'connectionmode', title: '设备通信接线方式', width: 260 },
                { key: 'devstatus', title: '设备状态', width: 150 },
                { key: 'manucontact', title: '厂家联系人', width: 180 },
                { key: 'manuinfo', title: '厂家联系方式', width: 200 }
            ];

            const subTableHeight = 50 * (item.value.length + 1);
            const subTableStartY = y + (rowHeight - subTableHeight) / 2;
            drawSubTable(subTableCols, ctx, item.value, padding + labelWidth + 10, subTableStartY);
        } else {
            // 🔥 使用左对齐 + 精确起点绘制长文本
            const cellX = padding + labelWidth + 10;      // 左内边距 10px
            const cellWidth = valueWidth - 20;           // 总宽度减去左右各 10px
            const textH = getTextHeight(ctx, item.value, cellWidth);
            const startY = y + (rowHeight - textH) / 2;  // 垂直居中起始点

            drawTextWrapLeft(ctx, item.value, cellX, startY, cellWidth, lineHeight);
        }

        y += rowHeight;
    }

    // 完成绘制
    setTimeout(() => {
        ctx.draw(true, () => {
            console.log('绘制完成');
            exportImage();
        });
    }, 100);
}

/* ================= 导出图片 ================= */
function exportImage() {
	// #ifdef H5
	uni.canvasToTempFilePath({
		canvasId: 'reportCanvas',
		success: (res) => {
			loading.value = false;
			// 预览图片
			uni.previewImage({
				urls: [res.tempFilePath]
			});
		},
		fail: (err) => {
			console.error('生成图片失败', err);
		}
	});
	// #endif
	
	// #ifdef APP || APP-PLUS || MP-WEIXIN
	uni.canvasToTempFilePath({
		canvasId: 'reportCanvas',
		success(res) {
			uni.saveImageToPhotosAlbum({
				filePath: res.tempFilePath,
				success: () => {
					loading.value = false;
					uni.showToast({
						icon: 'success',
						title: '保存成功',
						duration: 1500,
						complete: () => {
							// 预览图片
							uni.previewImage({
								urls: [res.tempFilePath]
							});
						}
					})
				},
				fail: (err) => {
					uni.showToast({
						icon: 'none',
						title: err || '保存失败',
						duration: 1500
					})
				}
			});
		},
		fail(err) {
			console.error('生成图片失败', err);
		}
	});
	// #endif
}

// 生成图片
async function handleCanvasToImageChange(id: number) {
	loading.value = true;
	let outInventoryIdStatusObj: any = {};
    const data = await fetchGetPrjInfo(id);
    const data1 = await fetchGetPrjMemberDataList({ page: 1, limit: 100, pid: id });
    const data2 = await fetchGetDebugEquipmentDataList({ page: 1, limit: 100, pid: id });
    const data3 = await fetchGetDebugBusinessDataList({ page: 1, limit: 100, pid: id });
	const data4 = await fetchGetContractsDevicesPageByPrjId({ pid: id });
	if (data4.length > 0) {
		data4.forEach((item: any) => {
			outInventoryIdStatusObj[item.id] = Number(item.status) === 0 ? '未出库' : Number(item.status) === 1 ? '部分出库' : Number(item.status) === 2 ? '已出库' : Number(item.status) === 3 ? '无需出库' : '未知';
		});
	}
    reportData[0].value = data.plantime;
    reportData[1].value = data.proname ? (data.hasOwnProperty('dispatch') ? data.proname + ' / ' + data.dispatch : data.proname) : (data.hasOwnProperty('dispatch') ? data.dispatch : '');
    reportData[2].value = data.proaddr;
    reportData[3].value = data.dtype === 0 ? '现场调试' : data.dtype === 1 ? '远程调试' : '无需调试';
	reportData[4].value = '';
	reportData[5].value = data1.list;
    reportData[6].value = "";
    if (data3.list.length > 0) {
		let finallyUserList = [...new Set(data3.list.filter((item: any) => item.status !== 3).map((item: any) => item.dbusername))];
        data3.list.forEach((item: any) => {
            reportData[6].value += item.debugname + '、';
        });
		reportData[4].value = finallyUserList.join("、");
        reportData[6].value = reportData[6].value.substring(0, reportData[6].value.length - 1);
		console.log('reportData[6].value', reportData[6].value);
    }
	reportData[7].value = data2.list.map((data2Item: any) => {
		return {
			...data2Item,
			install: data2Item.install === 0 ? '是' : data2Item.install === 1 ? '否' : '未知',
			devstatus: data2Item.status === 0 ? '正常' : data2Item.status === 1 ? '异常' : '未知',
			outInventoryStatus: outInventoryIdStatusObj[String(data2Item.id)] || '未知'
		}
	});
    const ctx = uni.createCanvasContext('reportCanvas');
    ctx.setFontSize(fontSize);

    // 等 canvas resize 完成再画
    setTimeout(drawReport, 50);
}

function recalcTopFixedHeight() {
	const token = uni.getStorageSync("token");
	if (!token) return;
    if (!topFixedWrap.value) return;
    uni.createSelectorQuery()
        .select('.topFixedWrap')
        .boundingClientRect((rect: any) => {
            if (rect && rect.height !== undefined) {
                topFixedHeight.value = rect.height;
                const sysInfo = uni.getSystemInfoSync();
                scrollViewHeight.value = sysInfo.windowHeight - topFixedHeight.value - 115;
            }
        })
        .exec();
}

// 获取项目类型的总数
async function getDiffTypeCount() {
    if (!hasPermission('system:homePage:select')) {
        uni.showToast({
            icon: 'none',
            title: '暂无获取项目类型数量权限, 请联系管理员',
            duration: 1500
        })
        return
    }
    try {
        const data = await fetchGetSystemHomePageInfo();
        tabsList.value[0].count = data.project.projects;
        tabsList.value[1].count = data.project.projectn1;
        tabsList.value[2].count = data.project.project0;
        tabsList.value[3].count = data.project.project1;
        tabsList.value[4].count = data.project.project2;
        tabsList.value[5].count = data.project.project3;
    } catch (error) {
        console.error('获取项目类型的总数失败', error);
    }
}

// 清除
function handleClearUserChange() {
    userDataList.value = allUserDataList.value;
}

// 搜索
function handleSearchUserChange() {
    userDataList.value = allUserDataList.value.filter((item: any) => item.username.indexOf(dataForm.participantFuzzy) !== -1);
}

// 获取全部调试人员
async function getAllUserDataList() {
    if (!hasPermission('sys:user:get:list')) {
        return
    }
    try {
        if (dataForm.userPage === 1) {
            userDataList.value = [];
            allUserDataList.value = [];
        }
        const data = await fetchGetAllUserDataList({ page: dataForm.userPage, limit: dataForm.userLimit, usertypes: '2, 3, 9' });
        userDataList.value = userDataList.value.concat(data.list);
        allUserDataList.value = allUserDataList.value.concat(data.list);
        dataForm.userTotal = Number(data.total);
    } catch (error) {
        console.error('获取全部调试人员失败', error);
    }
}

// 打开工程师选择弹框
async function handleLinkUserShowChange() {
    userShow.value = true;
}

// 工程师刷新
function handleScrollUserRefreshChange() {
    userTriggered.value = true;
    dataForm.userPage = 1;
    getAllUserDataList();
    setTimeout(() => {
        userTriggered.value = false;
        console.log('刷新完成');
    }, 1000)
}

// 滚动到底部
function handleScrolltolowerUserChange(e: any) {
    console.log('e', e);
    if (e.detail.direction === 'bottom' && allUserDataList.value.length < dataForm.userTotal) {
        dataForm.userPage++;
        getAllUserDataList();
    }
}

// 关闭选择人员弹框
function handleCloseUserShowChange() {
    userShow.value = false;
}

// 选择调试工程师
function handleRadioSelectChange({ value }: { value: any }) {
    const names = userDataList.value.find((item: any) => value === item.id);
    dataForm.participantname = names ? names.username : '';
    userShow.value = false;
}

// 清除参与人
function handleClearUserParticipantnameChange() {
	dataForm.participantname = "";
	dataForm.participant = null;
}

// 清除
function handleClearChange() {
    scrollToTop();
    // 关键：禁止滚动加载
    allowScrollLoad.value = false;
    if (activeTab.value === 0) {
        dataForm.page = 1;
        dataList.value = [];
    } else if (activeTab.value === 1) {
        dataForm.notApprovedPage = 1;
        notApprovedList.value = [];
    } else if (activeTab.value === 2) {
        dataForm.noStartPage = 1;
        noStartDataList.value = [];
    } else if (activeTab.value === 3) {
        dataForm.progressingPage = 1;
        progressingDataList.value = [];
    } else if (activeTab.value === 4) {
        dataForm.auditPage = 1;
        auditDataList.value = [];
    } else if (activeTab.value === 5) {
        dataForm.completePage = 1;
        completeDataList.value = [];
    }
    getDataList();
}

// 搜索
function handleSearchChange() {
    // 关键：禁止滚动加载
    scrollToTop();
    allowScrollLoad.value = false;
    if (activeTab.value === 0) {
        dataForm.page = 1;
        dataList.value = [];
    } else if (activeTab.value === 1) {
        dataForm.notApprovedPage = 1;
        notApprovedList.value = [];
    } else if (activeTab.value === 2) {
        dataForm.noStartPage = 1;
        noStartDataList.value = [];
    } else if (activeTab.value === 3) {
        dataForm.progressingPage = 1;
        progressingDataList.value = [];
    } else if (activeTab.value === 4) {
        dataForm.auditPage = 1;
        auditDataList.value = [];
    } else if (activeTab.value === 5) {
        dataForm.completePage = 1;
        completeDataList.value = [];
    }
    getDataList();
}

function scrollToTop() {
    nextTick(() => {
        scrollTop.value = fixedScrollTop.value - 1;

        nextTick(() => {
            scrollTop.value = 0;
            fixedScrollTop.value = 0;
        });
    })
}

// 切换近期项目、项目列表
const handleTabsPrjChange = ({ index }: { index: number }) => {
	activePrjTab.value = index;
	scrollToTop();
	// 关键：禁止滚动加载
	allowScrollLoad.value = false;
	if (index === 0) {
		if (recentDataList.value.length === 0) {
		    getDataList();
		}
	} else {
		if (activeTab.value === 0) {
		    if (dataList.value.length === 0) {
		        getDataList();
		    }
		} else if (activeTab.value === 1) {
		    if (notApprovedList.value.length === 0) {
		        getDataList();
		    }
		} else if (activeTab.value === 2) {
		    if (noStartDataList.value.length === 0) {
		        getDataList();
		    }
		} else if (activeTab.value === 3) {
		    if (progressingDataList.value.length === 0) {
		        getDataList();
		    }
		} else if (activeTab.value === 4) {
		    if (auditDataList.value.length === 0) {
		        getDataList();
		    }
		} else if (activeTab.value === 5) {
		    if (completeDataList.value.length === 0) {
		        getDataList();
		    }
		}
	}
}

// 切换tabs
const handleTabsChange = ({ index }: { index: number }) => {
    activeTab.value = index;
    // 关键：禁止滚动加载
    allowScrollLoad.value = false;
    if (index === 0) {
        if (dataList.value.length === 0) {
			scrollToTop();
            getDataList();
        }
    } else if (index === 1) {
        if (notApprovedList.value.length === 0) {
			scrollToTop();
            getDataList();
        }
    } else if (index === 2) {
        if (noStartDataList.value.length === 0) {
			scrollToTop();
            getDataList();
        }
    } else if (index === 3) {
        if (progressingDataList.value.length === 0) {
			scrollToTop();
            getDataList();
        }
    } else if (index === 4) {
        if (auditDataList.value.length === 0) {
			scrollToTop();
            getDataList();
        }
    } else if (index === 5) {
        if (completeDataList.value.length === 0) {
			scrollToTop();
            getDataList();
        }
    }
    // getDataList();
}

// 获取项目列表信息
async function getDataList() {
	let permissionList = globalData.permissionList.length > 0 ? globalData.permissionList : uni.getStorageSync('permissionList') || [];
	if (permissionList.length === 0) {
		return
	}
    if (!hasPermission('project:Info:select')) {
        uni.showToast({
            icon: 'none',
            title: '暂无项目查询权限, 请联系管理员',
            duration: 1500,
            complete: () => {
                // 请求完成后，延迟恢复（防止瞬间触发）
                setTimeout(() => {
                    allowScrollLoad.value = true;
                    scrollToTop();
                }, 300);
            }
        })
        return
    }
	if (userType.value === 1) {
		activePrjTab.value = 1;
	}
    try {
		if (activePrjTab.value === 0) {
			if (dataForm.recentPage === 1) {
				recentDataList.value = [];
			}
			const recentData = await fetchGetPrjHomePageInfo({ page: dataForm.recentPage, limit: dataForm.limit });
			recentDataList.value = recentDataList.value.concat(recentData.list);
			dataForm.recentTotal = Number(recentData.total);
			if (recentDataList.value.length < dataForm.recentTotal) {
				dataForm.recentState = 'loadmore';
			} else {
				dataForm.recentState = 'finished';
			}
		} else {
			if (activeTab.value === 0) {
			    if (dataForm.page === 1) {
			        dataList.value = [];
			    }
			} else if (activeTab.value === 1) {
			    if (dataForm.notApprovedPage === 1) {
			        notApprovedList.value = [];
			    }
			} else if (activeTab.value === 2) {
			    if (dataForm.noStartPage === 1) {
			        noStartDataList.value = [];
			    }
			} else if (activeTab.value === 3) {
			    if (dataForm.progressingPage === 1) {
			        progressingDataList.value = [];
			    }
			} else if (activeTab.value === 4) {
			    if (dataForm.auditPage === 1) {
			        auditDataList.value = [];
			    }
			} else if (activeTab.value === 5) {
			    if (dataForm.completePage === 1) {
			        completeDataList.value = [];
			    }
			}
			let page: number = activeTab.value === 0 ? dataForm.page : activeTab.value === 1 ? dataForm.notApprovedPage : activeTab.value === 2 ? dataForm.noStartPage : activeTab.value === 3 ? dataForm.progressingPage : activeTab.value === 4 ? dataForm.auditPage : activeTab.value === 5 ? dataForm.completePage : dataForm.page;
			let queryParams: any = activeTab.value === 0 ? {
				page,
				limit: dataForm.limit,
				fuzzy: dataForm.fuzzy,
				provice: provinceInfo.selectProvince === -1 ? null : provinceInfo.selectProvince,
				regions: provinceInfo.selectRegion.length > 0 ? provinceInfo.selectRegion.join(",") : null,
				ptype: ptype.value === -1 ? null : ptype.value,
				dtype: debugType.value === -1 ? null : debugType.value,
				participant: dataForm.participant,
				startTime: rangeTime.value.length > 0 ? rangeTime.value[0] ? getSystemDate(1, rangeTime.value[0]) : null : null,
				endTime: rangeTime.value.length > 0 ? rangeTime.value[1] ? getSystemDate(1, rangeTime.value[1]) : null : null,
			} : { 
				page,
				limit: dataForm.limit,
				fuzzy: dataForm.fuzzy,
				status: activeTab.value - 2,
				provice: provinceInfo.selectProvince === -1 ? null : provinceInfo.selectProvince,
				regions: provinceInfo.selectRegion.length > 0 ? provinceInfo.selectRegion.join(",") : null,
				ptype: ptype.value === -1 ? null : ptype.value,
				dtype: debugType.value === -1 ? null : debugType.value,
				participant: dataForm.participant,
				startTime: rangeTime.value.length > 0 ? rangeTime.value[0] ? getSystemDate(1, rangeTime.value[0]) : null : null,
				endTime: rangeTime.value.length > 0 ? rangeTime.value[1] ? getSystemDate(1, rangeTime.value[1]) : null : null,
			};
			const data = activeTab.value === 0 ? await fetchGetPrjDataList(queryParams) : await fetchGetPrjDataList(queryParams);
			if (activeTab.value === 0) {
			    dataList.value = dataList.value.concat(data.list);
			    dataForm.total = Number(data.total);
			    tabsList.value[0].count = dataForm.total;
			    if (dataList.value.length < dataForm.total) {
			        dataForm.state = 'loadmore';
			    } else {
			        dataForm.state = 'finished';
			    }
			} else if (activeTab.value === 1) {
			    notApprovedList.value = notApprovedList.value.concat(data.list);
			    dataForm.notApprovedTotal = Number(data.total);
			    tabsList.value[1].count = dataForm.notApprovedTotal;
			    if (notApprovedList.value.length < dataForm.notApprovedTotal) {
			        dataForm.notApprovedState = 'loadmore';
			    } else {
			        dataForm.notApprovedState = 'finished';
			    }
			} else if (activeTab.value === 2) {
			    noStartDataList.value = noStartDataList.value.concat(data.list);
			    dataForm.noStartTotal = Number(data.total);
			    tabsList.value[2].count = dataForm.noStartTotal;
			    if (noStartDataList.value.length < dataForm.noStartTotal) {
			        dataForm.noStartState = 'loadmore';
			    } else {
			        dataForm.noStartState = 'finished';
			    }
			} else if (activeTab.value === 3) {
			    progressingDataList.value = progressingDataList.value.concat(data.list);
			    dataForm.progressingTotal = Number(data.total);
			    tabsList.value[3].count = dataForm.progressingTotal;
			    if (progressingDataList.value.length < dataForm.progressingTotal) {
			        dataForm.progressingState = 'loadmore';
			    } else {
			        dataForm.progressingState = 'finished';
			    }
			} else if (activeTab.value === 4) {
			    auditDataList.value = auditDataList.value.concat(data.list);
			    dataForm.auditTotal = Number(data.total);
			    tabsList.value[4].count = dataForm.auditTotal;
			    if (auditDataList.value.length < dataForm.auditTotal) {
			        dataForm.auditState = 'loadmore';
			    } else {
			        dataForm.auditState = 'finished';
			    }
			} else if (activeTab.value === 5) {
			    completeDataList.value = completeDataList.value.concat(data.list);
			    dataForm.completeTotal = Number(data.total);
			    tabsList.value[5].count = dataForm.completeTotal;
			    if (completeDataList.value.length < dataForm.completeTotal) {
			        dataForm.completeState = 'loadmore';
			    } else {
			        dataForm.completeState = 'finished';
			    }
			}
		}
        
        // 请求完成后，延迟恢复（防止瞬间触发）
        setTimeout(() => {
            allowScrollLoad.value = true;
            // scrollToTop();
			// if (activePrjTab.value === 0) {
			// 	if (dataForm.recentPage === 1) {
			// 		scrollToTop();
			// 	}
			// } else {
			// 	if (activeTab.value === 0) {
			// 	    if (dataForm.page === 1) {
			// 	        scrollToTop();
			// 	    }
			// 	} else if (activeTab.value === 1) {
			// 	    if (dataForm.notApprovedPage === 1) {
			// 	        scrollToTop();
			// 	    }
			// 	} else if (activeTab.value === 2) {
			// 	    if (dataForm.noStartPage === 1) {
			// 	        scrollToTop();
			// 	    }
			// 	} else if (activeTab.value === 3) {
			// 	    if (dataForm.progressingPage === 1) {
			// 	        scrollToTop();
			// 	    }
			// 	} else if (activeTab.value === 4) {
			// 	    if (dataForm.auditPage === 1) {
			// 	        scrollToTop();
			// 	    }
			// 	} else if (activeTab.value === 5) {
			// 	    if (dataForm.completePage === 1) {
			// 	        scrollToTop();
			// 	    }
			// 	}
			// }
        }, 300);
    } catch (err) {
        console.error('获取项目列表失败', err);
        // 请求完成后，延迟恢复（防止瞬间触发）
        setTimeout(() => {
            allowScrollLoad.value = true;
            // scrollToTop();
			// if (activePrjTab.value === 0) {
			// 	if (dataForm.recentPage === 1) {
			// 		scrollToTop();
			// 	}
			// } else {
			// 	if (activeTab.value === 0) {
			// 	    if (dataForm.page === 1) {
			// 	        scrollToTop();
			// 	    }
			// 	} else if (activeTab.value === 1) {
			// 	    if (dataForm.notApprovedPage === 1) {
			// 	        scrollToTop();
			// 	    }
			// 	} else if (activeTab.value === 2) {
			// 	    if (dataForm.noStartPage === 1) {
			// 	        scrollToTop();
			// 	    }
			// 	} else if (activeTab.value === 3) {
			// 	    if (dataForm.progressingPage === 1) {
			// 	        scrollToTop();
			// 	    }
			// 	} else if (activeTab.value === 4) {
			// 	    if (dataForm.auditPage === 1) {
			// 	        scrollToTop();
			// 	    }
			// 	} else if (activeTab.value === 5) {
			// 	    if (dataForm.completePage === 1) {
			// 	        scrollToTop();
			// 	    }
			// 	}
			// }
        }, 300);
    }
}

// 项目详情
function handleJumpPageChange(id: number, proname: string) {
    uni.navigateTo({
        // url: `/projectPages/contractpage/Index?id=${id}`,
        url: `/projectPages/projectdetail/Index?pid=${id}&proname=${encodeURIComponent(proname)}`,
    });
}

// 添加项目
const handleAddProjectChange = () => {
    uni.navigateTo({
        url: '/projectPages/addproject/Index',
    });
}

// 修改项目
const handleJumpChange = (url: string) => {
    if (url) {
		uni.navigateTo({
		    url
		});
	}
}

// 启动、审核项目
async function handleCheckPrjChange(id: number, status: number) {
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
            msg: status === 0 ? '确定要核准该项目吗？' : status === 3 ? '确定要审核完成该项目吗？' : '确定要启动该项目吗？',
            title: '提示',
            confirmButtonProps: {
                type: 'error',
            },
        })
        .then(async () => {
            const data = await fetchUpdatePrjInfo([{ id: id, status }]);
            uni.showToast({
                icon: "none",
                title: status === 0 ? '项目核准成功' : status === 3 ? "审核已完成" : '项目启动成功',
                duration: 1500,
                complete: async () => {
                    if (activeTab.value === 0) {
                        dataForm.page = 1;
                    } else if (activeTab.value === 1) {
                        dataForm.notApprovedPage = 1;
                    } else if (activeTab.value === 2) {
                        dataForm.noStartPage = 1;
                    } else if (activeTab.value === 3) {
                        dataForm.progressingPage = 1;
                    } else if (activeTab.value === 4) {
                        dataForm.auditPage = 1;
                    } else if (activeTab.value === 5) {
                        dataForm.completePage = 1;
                    }
                    await getDataList();
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

// 删除项目
async function handleDeleteProjectChange(id: number) {
    if (!hasPermission('project:Info:delete')) {
        return
    }
    try {
        message
        .confirm({
            msg: '确定要删除该项目吗？',
            title: '提示',
            confirmButtonProps: {
                type: 'error',
            },
        })
        .then(async () => {
            const data = await fetchDeletePrjInfo(id);
            uni.showToast({
                icon: "none",
                title: "删除项目成功",
                duration: 1500,
                complete: async () => {
                    // await getDiffTypeCount();
                    await getDataList();
                }
            })
        })
        .catch(() => {
            console.log('点击了取消按钮');
        });
    } catch (error) {
        console.error('删除项目失败', error);
    }
}

function handleProjectChange(data: any) {
    activeTab.value = 3;
    dataForm.auditPage = 1;
    dataForm.fuzzy = decodeURIComponent(data.projectname);
    // getDiffTypeCount();
    getDataList();
}

function handleTabbarChange({ value }: { value: string }) {
	if (value !== 'project') {
		setTabbarItemActive(value);
		uni.switchTab({
			url: '/pages/' + activeTabbar.value.name
		})
	}
}

// 滚动到顶部
function handleGotoTopChange() {
    scrollTop.value = fixedScrollTop.value;
    nextTick(() => {
        scrollTop.value = 0;
    })
}

// 获取省份数据
async function getProvinceDataInfo() {
    try {
        const data = await fetchGetProvinceInfo();
        provinceInfo.provinceData = [{ id: -1, name: '全部省份' }].concat(data);
    } catch (error) {
        console.error('获取省份数据失败', error);
    }
}

// 获取地区数据
async function getRegionDataInfo() {
    try {
        if (provinceInfo.selectProvince === -1) {
            provinceInfo.regionData = [];
            provinceInfo.selectRegion = [];
            return
        }
        const data = await fetchGetCityInfo({ province: provinceInfo.selectProvince });
        provinceInfo.regionData = [].concat(data);
    } catch (error) {
        console.error('获取地区数据失败', error);
    }
}

// 选择地区
function handleCheckRegionChange({ value }: { value: any }) {
    console.log('va', value);
    if (value === 1) {
        provinceInfo.selectRegion = [];
        provinceInfo.regionData.forEach((item: any) => {
            provinceInfo.selectRegion.push(item.id);
        });
    } else {
        provinceInfo.selectRegion = [];
    }
    // if (value && value.length > 0) {
    //     if (value.indexOf(-1) !== -1) {
    //         provinceInfo.selectRegion = [];
    //         provinceInfo.regionData.forEach((item: any) => {
    //             provinceInfo.selectRegion.push(item.id);
    //         });
    //     } else {
    //         if (provinceInfo.regionData.length - 1 === provinceInfo.selectRegion.length) {
    //             provinceInfo.selectRegion.push(-1);
    //         }
    //     }
    // }
}

// 清除起止时间
function handleClearRangeTimeChange() {
	rangeTime.value = [];
	console.log(rangeTime.value);
}

// 选择清空
function handleSelectClearChange() {
	ptype.value = -1;
	debugType.value = -1;
	rangeTime.value = [];
	dataForm.participant = null;
	dataForm.participantname = "";
	handleSearchChange();
}

// 选择确定
function handleSelectConfirmChange() {
	dropMenuRef.value[1].close();
	handleSearchChange();
}

// await startServe("前台运行中","点击返回软件");
// console.log('getLocation获取是否开启定位', getLocation());
// console.log('preciseLocation获取是否开启始终定位', preciseLocation());
// console.log('getBattery是否开启电池优化白名单', getBattery());
const a = async function(){
	// #ifdef APP || APP-PLUS
	console.log('发送请求', uni.getStorageSync("clockInPid"));
	console.log(uni.getStorageSync('LIn97112479'));
	try {
		if (uni.getStorageSync("clockInPid") && uni.getStorageSync("LIn97112479")) {
			let pid: any = uni.getStorageSync("clockInPid"),
				LInObj: any = uni.getStorageSync("LIn97112479") ? JSON.parse(uni.getStorageSync("LIn97112479")) : {};
			if (JSON.stringify(LInObj) === '{}') {
				return
			}
			const loglatInfo: any = wgs84ToGcj02(LInObj.coords.latitude, LInObj.coords.longitude);
			const data = await fetchSavePrjClockinInfo({
				list: [{
					pid,
					ctype: 2,
					longitude: loglatInfo.lon,
					latitude: loglatInfo.lat,
					devtime: new Date().getTime()
				}],
				check: true
			})
		}
	} catch (err) {
		console.log('err', err);
	}
	// #endif
}

const b = function(err: any){
	// #ifdef APP || APP-PLUS
	uni.showModal({
		title: '提示',
		content: JSON.stringify(err)
	})
	// #endif
}


onReady(() => {
	uni.hideTabBar();
	// const token = uni.getStorageSync('token');
	// if (!token) {
	// 	uni.hideToast();
	// 	uni.reLaunch({
	// 		url: '/pages/login'
	// 	});
	// }
})

onLoad(() => {
	getProvinceDataInfo();
	if (userType.value !== 3) {
		dataForm.userPage = 1;
		getAllUserDataList();
	}
	uni.setNavigationBarTitle({
		title: "项目"
	})
    if (!uni.getStorageSync('projectname')) {
        // getDiffTypeCount();
        getDataList();
    }
    uni.$on('refreshListPrj', getDataList); // 监听刷新事件
    uni.$on('projectChanged', handleProjectChange);
	// #ifdef APP || APP-PLUS
	clearLocations();
	getLocations({provider:"system",geocode:true,fun:a,err:b,time:900000});
	// #endif
});

// 监听位置事件
uni.$on('locationPositionChange', (e) => {
    // TODO: 是否开启待确认
	uni.setStorageSync("clockInPid", e.pid);
})

// 关闭监听位置事件
uni.$on('locationPositionCloseChange', () => {
	uni.removeStorageSync("clockInPid");
	// #ifdef APP || APP-PLUS
	clearLocations();
	// #endif
})

onShow(() => {
    if (uni.getStorageSync('projectname')) {
		activePrjTab.value = 1;
        activeTab.value = 3;
        dataForm.auditPage = 1;
        dataForm.fuzzy = decodeURIComponent(uni.getStorageSync('projectname'));
        // getDiffTypeCount();
        getDataList();
        uni.removeStorageSync('projectname');
    }
})

onUnload(() => {
    uni.$off('refreshListPrj', getDataList); // 页面销毁时解绑
});

function handleScrollChange(e: any) {
    fixedScrollTop.value = e.detail.scrollTop;
};

// 上拉加载
const handleScrollTolowerChange = throttle(async(e: any) => {
    if (!allowScrollLoad.value) return;
    if (e.detail.direction === "bottom") {
		if (activePrjTab.value === 0) {
			if (recentDataList.value.length < dataForm.recentTotal) {
			    dataForm.recentPage++;
			    getDataList();
			} else if (recentDataList.value.length === dataForm.recentTotal) {
			    dataForm.recentState = 'finished';
			}
		} else {
			if (activeTab.value === 0) {
			    if (dataList.value.length < dataForm.total) {
			        dataForm.page++;
			        getDataList();
			    } else if (dataList.value.length === dataForm.total) {
			        dataForm.state = 'finished';
			    }
			} else if (activeTab.value === 1) {
			    if (notApprovedList.value.length < dataForm.notApprovedTotal) {
			        dataForm.notApprovedPage++;
			        getDataList();
			    } else if (notApprovedList.value.length === dataForm.notApprovedTotal) {
			        dataForm.notApprovedState = 'finished';
			    }
			} else if (activeTab.value === 2) {
			    if (noStartDataList.value.length < dataForm.noStartTotal) {
			        dataForm.noStartPage++;
			        getDataList();
			    } else if (noStartDataList.value.length === dataForm.noStartTotal) {
			        dataForm.noStartState = 'finished';
			    }
			} else if (activeTab.value === 3) {
			    if (progressingDataList.value.length < dataForm.progressingTotal) {
			        dataForm.progressingPage++;
			        getDataList();
			    } else if (progressingDataList.value.length === dataForm.progressingTotal) {
			        dataForm.progressingState = 'finished';
			    }
			} else if (activeTab.value === 4) {
			    if (auditDataList.value.length < dataForm.auditTotal) {
			        dataForm.auditPage++;
			        getDataList();
			    } else if (auditDataList.value.length === dataForm.auditTotal) {
			        dataForm.auditState = 'finished';
			    }
			} else if (activeTab.value === 5) {
			    if (completeDataList.value.length < dataForm.completeTotal) {
			        dataForm.completePage++;
			        getDataList();
			    } else if (completeDataList.value.length === dataForm.completeTotal) {
			        dataForm.completeState = 'finished';
			    }
			}
		}
    }
}, 1000)

onPullDownRefresh(() => {
	if (activePrjTab.value === 0) {
		dataForm.recentPage = 1;
	} else {
		if (activeTab.value === 0) {
		    dataForm.page = 1;
		} else if (activeTab.value === 1) {
		    dataForm.notApprovedPage = 1;
		} else if (activeTab.value === 2) {
		    dataForm.noStartPage = 1;
		} else if (activeTab.value === 3) {
		    dataForm.progressingPage = 1;
		} else if (activeTab.value === 4) {
		    dataForm.auditPage = 1;
		} else if (activeTab.value === 5) {
		    dataForm.completePage = 1;
		}
	}
    getDataList();
    setTimeout(() => {
        uni.hideNavigationBarLoading(); // 完成停止加载
        uni.stopPullDownRefresh();
    }, 1000);
});

// onReachBottom(() => {});

onMounted(() => {
    nextTick(() => {
        setTimeout(() => {
            recalcTopFixedHeight();
        }, 50);
    });
    if (typeof window !== 'undefined' && window.addEventListener) {
        window.addEventListener('resize', recalcTopFixedHeight);
    }
});
</script>

<template>
	<wd-config-provider :theme="theme">
		<wd-navbar title="项目" safe-area-inset-top placeholder fixed :bordered="false" />
		<wd-message-box />
		
		<view class="wrapper">
			<!-- 顶部固定区域：搜索框 + tabs -->
			<view ref="topFixedWrap" class="topFixedWrap">
				<view v-if="userType !== 1">
					<wd-tabs v-model="activePrjTab" animated @change="handleTabsPrjChange">
						<wd-tab v-for="(tabsPrjItem, tabsPrjIndex) in tabsPrjList" :key="tabsPrjIndex" :title="tabsPrjItem.title">
							<scroll-view :scroll-y="true" :scroll-top="scrollTop" :style="{ height: scrollViewHeight + 'px' }" @scroll="handleScrollChange" @scrolltolower="handleScrollTolowerChange">
								<view v-if="activePrjTab === 0">
									<view v-if="recentDataList.length > 0">
										<uni-swipe-action>
											<uni-swipe-action-item v-for="(recentDataItem, recentDataIndex) in recentDataList" :key="recentDataIndex" :right-options="options" @click="handleDeleteProjectChange(recentDataItem.id)">
												<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: recentDataIndex === recentDataList.length - 1 ? '20rpx 20rpx 40rpx 20rpx' : '20rpx 20rpx 0', borderRadius: '20rpx' }">
													<view style="padding: 20rpx;">
														<view class="prjInfoHeader">
															<view class="left">
																<wd-text bold :text="recentDataItem.proname" size="15px" :color="isDark ? '#ffffff' : '#000000'" />
																<!-- <wd-text v-if="recentDataItem.ptype === 0" bold :text="recentDataItem.proname" size="15px" :color="isDark ? '#ffffff' : '#000000'" :lines="5" /> -->
																<!-- <wd-text v-if="recentDataItem.ptype === 1" bold :text="recentDataItem.proname" size="15px" type="error" :lines="5" /> -->
															</view>
															<view class="right">
																<wd-text bold :text="recentDataItem.status === -1 ? '未核准' : recentDataItem.status === 0 ? '未开始' : recentDataItem.status === 1 ? '进行中' : recentDataItem.status === 2 ? '待审核' : recentDataItem.status === 3 ? '已完成' : '未知'" size="14px" :type="recentDataItem.status === 0 ? 'default' : recentDataItem.status === 1 ? 'primary' : recentDataItem.status === 2 ? 'warning' : recentDataItem.status === 3 ? 'success' : 'default'" />
															</view>
														</view>
																
														<view @click="handleJumpPageChange(recentDataItem.id, recentDataItem.proname)">
															<wd-cell title="调试任务名称" icon="calendar" custom-class="cellClass">
																<wd-text bold :text="recentDataItem.debugname" size="14px"
																	:color="isDark ? '#ffffff' : '#000000'" />
															</wd-cell>
																
															<!-- <wd-cell title="调试任务名称" icon="layers" custom-class="cellClass" center :value="recentDataItem.debugname"></wd-cell> -->
															<wd-cell title="调试任务状态" icon="move" custom-class="cellClass" center>
																<wd-tag :type="recentDataItem.status === -1 ? 'warning' : recentDataItem.status === 0 ? 'default' : recentDataItem.status === 1 ? 'primary' : recentDataItem.status === 2 ? 'warning' : recentDataItem.status === 3 ? 'success' : 'default'" round>
																	{{ recentDataItem.status === -1 ? '申请中' : recentDataItem.status === 0 ? '待调试' : recentDataItem.status === 1 ? '实施中' : recentDataItem.status === 2 ? '待审核' : recentDataItem.status === 3 ? '审核完成' : '未知' }}
																</wd-tag>
															</wd-cell>
															<wd-cell title="调试人" icon="user" custom-class="cellClass" center :value="recentDataItem.username"></wd-cell>
															<wd-cell title="调试时间" icon="time" custom-class="cellClass" center :value="recentDataItem.dbdbtime"></wd-cell>
															<wd-cell title="调试任务审核时间" icon="time" custom-class="cellClass" center :value="recentDataItem.ckdbtime"></wd-cell>
															<wd-cell title="当前进度" icon="dashboard" custom-class="cellClass" center>
																<wd-progress color="#4d80f0" :percentage="recentDataItem.progess" />
															</wd-cell>
															<wd-cell title="商务联系人" icon="user" custom-class="cellClass" center :value="recentDataItem.businesscon"></wd-cell>
															<wd-cell title="最后打卡人" icon="user" custom-class="cellClass" center :value="recentDataItem.clockinusername"></wd-cell>
															<wd-cell title="最后打卡时间" icon="time" custom-class="cellClass" center :value="recentDataItem.lastclockintime"></wd-cell>
															<wd-cell title="打卡人数" icon="user" custom-class="cellClass" center :value="recentDataItem.clockincounts"></wd-cell>
															<wd-cell title="打卡人" icon="user" custom-class="cellClass" center :value="recentDataItem.clockinusers"></wd-cell>
														</view>
																
														<wd-gap bg-color="#cccccc" height="2rpx"></wd-gap>
														<!-- <wd-gap bg-color="#cccccc" height="2rpx" v-if="hasPermission('project:Info:update') && (userType === 0 || ((userType === 2 || userType === 3) && (recentDataItem.status === 0 || recentDataItem.status === 2)) || (userType === 4 && recentDataItem.status === -1))"></wd-gap> -->
																
														<view style="display: flex; justify-content: flex-end; margin-top: 10rpx; gap: 0 10rpx;">
															<wd-button size="small" type="primary" :loading="loading" @click.stop="handleCanvasToImageChange(recentDataItem.id)">生成工程调试单</wd-button>
															<wd-button size="small" type="primary" @click.stop="handleJumpChange('/projectPages/projectcontractpage/Index?id=' + recentDataItem.id)">关联合同</wd-button>
															<wd-button v-if="hasPermission('project:Info:update') && recentDataItem.status === -1 && (userType === 0 || (userType === 4 && (userId === '1021' || userId === '1023')))" size="small" type="primary" @click.stop="handleCheckPrjChange(recentDataItem.id, 0)">核准</wd-button>
															<wd-button v-if="hasPermission('project:Info:update') && recentDataItem.status === 0 && (userType === 0 || userType === 2 || userType === 3)" size="small" type="primary" @click.stop="handleCheckPrjChange(recentDataItem.id, 1)">启动</wd-button>
															<wd-button v-if="hasPermission('project:Info:update') && recentDataItem.status === 2 && (userType === 0 || userType === 2)" size="small" type="primary" @click.stop="handleCheckPrjChange(recentDataItem.id, 3)">审核</wd-button>
														</view>
													</view>
												</view>
											</uni-swipe-action-item>
										</uni-swipe-action>
									</view>
									<view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
										<wd-status-tip image="../static/search.png" tip="暂无项目" />
									</view>
								</view>
									
								<view v-if="activePrjTab === 1">
									<!-- 搜索框 -->
									<wd-search v-model="dataForm.fuzzy" placeholder="请输入项目名或客户名称" placeholder-left :placeholderClass="isDark ? 'whiteClass' : 'greyClass'"
										cancel-txt="搜索" @search="handleSearchChange" @cancel="handleSearchChange" @clear="handleClearChange" />
									<wd-drop-menu>
										<wd-drop-menu-item v-model="provinceInfo.selectProvince" :options="provinceInfo.provinceData" value-key="id" label-key="name" @change="getRegionDataInfo" />
										<!-- <wd-drop-menu-item v-model="provinceInfo.selectRegion" :options="provinceInfo.regionData" value-key="id" label-key="name"></wd-drop-menu-item> -->
										<wd-drop-menu-item title="全部地区">
											<wd-radio-group v-model="provinceInfo.selectRegionType" shape="button" v-if="provinceInfo.regionData.length > 0" cell @change="handleCheckRegionChange">
												<wd-radio :value="1">全选</wd-radio>
												<wd-radio :value="2">全不选</wd-radio>
											</wd-radio-group>
					
											<wd-checkbox-group v-model="provinceInfo.selectRegion" cell>
												<wd-checkbox v-for="(regionItem, regionIndex) in provinceInfo.regionData" :key="regionIndex" :modelValue="regionItem.id">
													{{ regionItem.name }}
												</wd-checkbox>
											</wd-checkbox-group>
										</wd-drop-menu-item>
										
										<wd-drop-menu-item ref="dropMenuRef" title="更多条件">
											<view style="display: flex; justify-content: left; align-items: center; justify-content: space-between; flex-wrap: nowrap; padding: 10px 0 10rpx 10px; width: calc(100vw - 60rpx);">
												<view style="display: flex; align-items: center;">
													<view style="width: 5px; height: 15px; background: #0055FE;"></view>
													<view style="margin-left: 10rpx; font-weight: bolder;">进度状态</view>
												</view>
											</view>
											<wd-radio-group v-model="ptype" shape="button" cell>
												<wd-radio :value="-1">全部</wd-radio>
												<wd-radio :value="0">正常</wd-radio>
												<wd-radio :value="1">延期</wd-radio>
												<wd-radio :value="2">作废</wd-radio>
											</wd-radio-group>
											
											<view style="display: flex; justify-content: left; align-items: center; justify-content: space-between; flex-wrap: nowrap; padding: 10px 0 10rpx 10px; width: calc(100vw - 60rpx);">
												<view style="display: flex; align-items: center;">
													<view style="width: 5px; height: 15px; background: #0055FE;"></view>
													<view style="margin-left: 10rpx; font-weight: bolder;">调试类型</view>
												</view>
											</view>
											<wd-radio-group v-model="debugType" shape="button" cell>
												<wd-radio :value="-1">全部</wd-radio>
												<wd-radio :value="0">现场调试</wd-radio>
												<wd-radio :value="1">远程调试</wd-radio>
												<wd-radio :value="2">无需调试</wd-radio>
											</wd-radio-group>
											
											<view style="display: flex; justify-content: left; align-items: center; justify-content: space-between; flex-wrap: nowrap; padding: 10px 0 10rpx 10px; width: calc(100vw - 60rpx);">
												<view style="display: flex; align-items: center;">
													<view style="width: 5px; height: 15px; background: #0055FE;"></view>
													<view style="margin-left: 10rpx; font-weight: bolder;">起止时间</view>
												</view>
											</view>
											
											<view style="display: flex; align-items: center; justify-content: space-between; width: 100vw;">
												<wd-datetime-picker use-second :z-index="9999" v-model="rangeTime" custom-style="width: calc(100vw - 40rpx);" />
												<wd-button v-if="rangeTime && rangeTime.length > 0" type="icon" icon="close-circle" custom-class="closeButtonWrap" @click="handleClearRangeTimeChange"></wd-button>
											</view>
											
											<view style="display: flex; justify-content: left; align-items: center; justify-content: space-between; flex-wrap: nowrap; padding: 10px 0 10rpx 10px; width: calc(100vw - 60rpx);" v-if="userType !== 3">
												<view style="display: flex; align-items: center;">
													<view style="width: 5px; height: 15px; background: #0055FE;"></view>
													<view style="margin-left: 10rpx; font-weight: bolder;">参与人</view>
												</view>
											</view>
											
											<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', padding: '10rpx 20rpx', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0 10rpx' }" v-if="userType !== 3">
												<wd-input disabled v-model="dataForm.participantname" placeholder="请选择参与人" custom-style="width: calc(100vw - 40rpx)">
												    <template #suffix>
												        <wd-button icon="link" size="small" @click.stop="handleLinkUserShowChange">参与人</wd-button>
												    </template>
												</wd-input>
												
												<wd-icon v-if="dataForm.participantname" size="30rpx" name="close-circle" @click.stop="handleClearUserParticipantnameChange"></wd-icon>
											</view>
											
											<view style="display: flex; justify-content: center; align-items: center; margin: 10rpx; gap: 0 10rpx;">
												<wd-button type="error" @click="handleSelectClearChange" custom-class="filterButton">清空</wd-button>
												<wd-button type="primary" @click="handleSelectConfirmChange" custom-class="filterButton">确定</wd-button>
											</view>
										</wd-drop-menu-item>
										
										<!-- <wd-drop-menu-item ref="dropMenuRef" :title="ptype === -1 ? '全部进度' : ptype === 0 ? '正常' : ptype === 1 ? '延期' : '未知'">
											<wd-radio-group v-model="ptype" shape="button" cell @change="handleSelectProgressChange">
												<wd-radio :value="-1">全部</wd-radio>
												<wd-radio :value="0">正常</wd-radio>
												<wd-radio :value="1">延期</wd-radio>
											</wd-radio-group>
										</wd-drop-menu-item> -->
									</wd-drop-menu>
									
									<!-- tabs -->
									<wd-tabs v-model="activeTab" animated @change="handleTabsChange">
										<wd-tab v-for="(item, index) in tabsList" :key="index" :title="item.title">
											<scroll-view :scroll-y="true" :scroll-top="scrollTop" :style="{ height: scrollViewHeight + 'px' }" @scroll="handleScrollChange" @scrolltolower="handleScrollTolowerChange">
												<view v-if="activeTab === 0">
													<view v-if="dataList.length > 0">
														<uni-swipe-action>
															<uni-swipe-action-item v-for="(dataItem, dataIndex) in dataList" :key="dataIndex" :right-options="options" @click="handleDeleteProjectChange(dataItem.id)">
																<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: dataIndex === dataList.length - 1 ? '20rpx 20rpx 40rpx 20rpx' : '20rpx 20rpx 0', borderRadius: '20rpx' }">
																	<view style="padding: 20rpx; ">
																		<view class="prjInfoHeader">
																			<view class="left">
																				<wd-text v-if="dataItem.ptype === 0" bold :text="dataItem.hasOwnProperty('dispatch') && dataItem.dispatch ? dataItem.proname + ' (' + dataItem.dispatch + ')' : dataItem.proname" size="15px" :color="isDark ? '#ffffff' : '#000000'" :lines="5" />
																				<wd-text v-if="dataItem.ptype === 1" bold :text="dataItem.hasOwnProperty('dispatch') && dataItem.dispatch ? dataItem.proname + ' (' + dataItem.dispatch + ')' : dataItem.proname" size="15px" type="warning" :lines="5" />
																				<wd-text v-if="dataItem.ptype === 2" bold :text="dataItem.hasOwnProperty('dispatch') && dataItem.dispatch ? dataItem.proname + ' (' + dataItem.dispatch + ')' : dataItem.proname" size="15px" type="error" :lines="5" />
																			</view>
																			<view class="right">
																				<wd-text bold :text="dataItem.status === -1 ? '未核准' : dataItem.status === 0 ? '未开始' : dataItem.status === 1 ? '进行中' : dataItem.status === 2 ? '待审核' : dataItem.status === 3 ? '已完成' : '未知'" size="14px" :type="dataItem.status === 0 ? 'default' : dataItem.status === 1 ? 'primary' : dataItem.status === 2 ? 'warning' : dataItem.status === 3 ? 'success' : 'default'" />
																				<wd-icon v-if="hasPermission('project:Info:update')" name="edit-outline" size="18px" @click.stop="handleJumpChange('/projectPages/addproject/Index?id=' + dataItem.id)"></wd-icon>
																			</view>
																		</view>
									
																		<view @click="handleJumpPageChange(dataItem.id, dataItem.proname)">
																			<wd-cell title="周期(天)" icon="calendar" custom-class="cellClass">
																				<wd-text bold :text="dataItem.period" size="14px"
																					:color="isDark ? '#ffffff' : '#000000'" />
																			</wd-cell>
									
																			<view v-if="hasPermission('project:DispatchContact:select')" @click.stop="handleJumpChange('/projectPages/diapatcherpage/Index?pid=' + dataItem.id)">
																				<wd-cell title="调度信息" icon="transfer" custom-class="cellClass">
																					<wd-icon name="view" size="22px"></wd-icon>
																				</wd-cell>
																			</view>
									
																			<wd-cell title="调试类型" icon="list" custom-class="cellClass">
																				<wd-tag type="primary" round>
																					{{ dataItem.dtype === 0 ? '现场调试' : dataItem.dtype === 1 ? '远程调试' : dataItem.dtype === 2 ? '无需调试' : '未知' }}
																				</wd-tag>
																			</wd-cell>
																			
																			<view @click.stop="handleJumpChange(dataItem.debugs > 0 ? '/projectPages/projectdetail/Index?pid=' + dataItem.id + '&activeTab=2' : '')">
																				<wd-cell title="调试任务数" icon="a-controlplatform" custom-class="cellClass">
																					<wd-text bold :text="dataItem.debugs" size="14px" :color="dataItem.debugs === 0 ? '#cccccc' : '#000000'" />
																				</wd-cell>
																			</view>
					
																			<view @click.stop="handleJumpChange(dataItem.summarys > 0 ? '/projectPages/prjsummarypage/Index?pid=' + dataItem.id + '&pname=' + encodeURIComponent(dataItem.proname) : '')">
																				<wd-cell title="项目总结数" icon="a-controlplatform" custom-class="cellClass">
																					<wd-text bold :text="dataItem.summarys" size="14px" :color="dataItem.summarys === 0 ? '#cccccc' : '#000000'" />
																				</wd-cell>
																			</view>
					
																			<view @click.stop="handleJumpChange(dataItem.dailys > 0 ? '/mePages/technicalsupportdaily/Index?pid=' + dataItem.id + '&pname=' + encodeURIComponent(dataItem.proname) : '')">
																				<wd-cell title="日报数" icon="a-controlplatform" custom-class="cellClass">
																					<wd-text bold :text="dataItem.dailys" size="14px" :color="dataItem.dailys === 0 ? '#cccccc' : '#000000'" />
																				</wd-cell>
																			</view>
																			
																			<wd-cell title="开始时间" icon="time" custom-class="cellClass">
																				<wd-text bold :text="dataItem.sdbtime || '--'" size="14px"
																					:color="isDark ? '#ffffff' : '#000000'" />
																			</wd-cell>
									
																			<wd-cell v-if="dataItem.status === 3 && dataItem.ckusername" title="验收人" icon="user" custom-class="cellClass">
																				<wd-text bold :text="dataItem.ckusername" size="14px"
																					:color="isDark ? '#ffffff' : '#000000'" />
																			</wd-cell>
									
																			<wd-cell v-if="dataItem.status === 3 && dataItem.ckdbtime" title="验收时间" icon="time" custom-class="cellClass">
																				<wd-text bold :text="dataItem.ckdbtime" size="14px"
																					:color="isDark ? '#ffffff' : '#000000'" />
																			</wd-cell>
																			
																			<wd-cell title="商务联系人" icon="user" custom-class="cellClass">
																				<wd-text bold :text="dataItem.businesscon" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
																			</wd-cell>
																			
																			<wd-cell v-if="dataItem.hasOwnProperty('plantime')" title="计划调试时间" icon="time" custom-class="cellClass">
																				<wd-text bold :text="dataItem.plantime" size="14px"
																					:color="isDark ? '#ffffff' : '#000000'" />
																			</wd-cell>
									
																			<!-- <wd-cell title="创建者" icon="user" custom-class="cellClass">
																				<wd-text bold :text="dataItem.username" size="14px"
																					:color="isDark ? '#ffffff' : '#000000'" />
																			</wd-cell>
									
																			<wd-cell title="创建时间" icon="time" custom-class="cellClass">
																				<wd-text bold :text="dataItem.dbtime" size="14px"
																					:color="isDark ? '#ffffff' : '#000000'" />
																			</wd-cell> -->
									
																			<view style="margin: 10rpx 0;">
																				<wd-progress color="#4d80f0" :percentage="dataItem.progess" />
																			</view>
																		</view>
									
																		<wd-gap bg-color="#cccccc" height="2rpx"></wd-gap>
																		<!-- <wd-gap bg-color="#cccccc" height="2rpx" v-if="hasPermission('project:Info:update') && (userType === 0 || ((userType === 2 || userType === 3) && (dataItem.status === 0 || dataItem.status === 2)) || (userType === 4 && dataItem.status === -1))"></wd-gap> -->
																		<!-- <wd-gap bg-color="#cccccc" height="2rpx" v-if="hasPermission('project:Info:update') && (userType === 0 || userType === 2 || userType === 3) && (dataItem.status === -1 || dataItem.status === 0 || dataItem.status === 2)"></wd-gap> -->
									
																		<view style="display: flex; justify-content: flex-end; margin-top: 10rpx; gap: 0 10rpx;">
																			<wd-button size="small" type="primary" :loading="loading" @click.stop="handleCanvasToImageChange(dataItem.id)">生成工程调试单</wd-button>
																			<wd-button size="small" type="primary" @click.stop="handleJumpChange('/projectPages/projectcontractpage/Index?id=' + dataItem.id)">关联合同</wd-button>
																			<wd-button v-if="hasPermission('project:Info:update') && dataItem.status === -1 && (userType === 0 || (userType === 4 && (userId === '1021' || userId === '1023')))" size="small" type="primary" @click.stop="handleCheckPrjChange(dataItem.id, 0)">核准</wd-button>
																			<wd-button v-if="hasPermission('project:Info:update') && dataItem.status === 0 && (userType === 0 || userType === 2 || userType === 3)" size="small" type="primary" @click.stop="handleCheckPrjChange(dataItem.id, 1)">启动</wd-button>
																			<wd-button v-if="hasPermission('project:Info:update') && dataItem.status === 2 && (userType === 0 || userType === 2)" size="small" type="primary" @click.stop="handleCheckPrjChange(dataItem.id, 3)">审核</wd-button>
																		</view>
																	</view>
																</view>
															</uni-swipe-action-item>
														</uni-swipe-action>
													</view>
													<view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
														<wd-status-tip image="../static/search.png" tip="暂无项目" />
													</view>
												</view>
									
												<view v-if="activeTab === 1">
													<view v-if="notApprovedList.length > 0">
														<uni-swipe-action>
															<uni-swipe-action-item v-for="(notApproveItem, notApproveIndex) in notApprovedList" :key="notApproveIndex" :right-options="options" @click="handleDeleteProjectChange(notApproveItem.id)">
																<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: notApproveIndex === notApprovedList.length - 1 ? '20rpx 20rpx 40rpx 20rpx' : '20rpx 20rpx 0', borderRadius: '20rpx' }">
																	<view style="padding: 20rpx; ">
																		<view class="prjInfoHeader">
																			<view class="left">
																				<wd-text v-if="notApproveItem.ptype === 0" bold :text="notApproveItem.hasOwnProperty('dispatch') && notApproveItem.dispatch ? notApproveItem.proname + ' (' + notApproveItem.dispatch + ')' : notApproveItem.proname" size="15px" :color="isDark ? '#ffffff' : '#000000'" :lines="5" />
																				<wd-text v-if="notApproveItem.ptype === 1" bold :text="notApproveItem.hasOwnProperty('dispatch') && notApproveItem.dispatch ? notApproveItem.proname + ' (' + notApproveItem.dispatch + ')' : notApproveItem.proname" size="15px" type="warning" :lines="5" />
																				<wd-text v-if="notApproveItem.ptype === 2" bold :text="notApproveItem.hasOwnProperty('dispatch') && notApproveItem.dispatch ? notApproveItem.proname + ' (' + notApproveItem.dispatch + ')' : notApproveItem.proname" size="15px" type="error" :lines="5" />
																			</view>
																			<view class="right">
																				<wd-text bold :text="notApproveItem.status === -1 ? '未核准' : notApproveItem.status === 0 ? '未开始' : notApproveItem.status === 1 ? '进行中' : notApproveItem.status === 2 ? '待审核' : notApproveItem.status === 3 ? '已完成' : '未知'" size="14px" :type="notApproveItem.status === 0 ? 'default' : notApproveItem.status === 1 ? 'primary' : notApproveItem.status === 2 ? 'warning' : notApproveItem.status === 3 ? 'success' : 'default'" />
																				<wd-icon v-if="hasPermission('project:Info:update')" name="edit-outline" size="18px" @click.stop="handleJumpChange('/projectPages/addproject/Index?id=' + notApproveItem.id)"></wd-icon>
																			</view>
																		</view>
									
																		<view @click="handleJumpPageChange(notApproveItem.id, notApproveItem.proname)">
																			<wd-cell title="周期(天)" icon="calendar" custom-class="cellClass">
																				<wd-text bold :text="notApproveItem.period" size="14px"
																					:color="isDark ? '#ffffff' : '#000000'" />
																			</wd-cell>
									
																			<view v-if="hasPermission('project:DispatchContact:select')" @click.stop="handleJumpChange('/projectPages/diapatcherpage/Index?pid=' + notApproveItem.id)">
																				<wd-cell title="调度信息" icon="transfer" custom-class="cellClass">
																					<wd-icon name="view" size="22px"></wd-icon>
																				</wd-cell>
																			</view>
									
																			<wd-cell title="调试类型" icon="list" custom-class="cellClass">
																				<wd-tag type="primary" round>
																					{{ notApproveItem.dtype === 0 ? '现场调试' : notApproveItem.dtype === 1 ? '远程调试' : notApproveItem.dtype === 2 ? '无需调试' : '未知' }}
																				</wd-tag>
																			</wd-cell>
																			
																			<view @click.stop="handleJumpChange(notApproveItem.debugs > 0 ? '/projectPages/projectdetail/Index?pid=' + notApproveItem.id + '&activeTab=2' : '')">
																				<wd-cell title="调试任务数" icon="a-controlplatform" custom-class="cellClass">
																					<wd-text bold :text="notApproveItem.debugs" size="14px" :color="notApproveItem.debugs === 0 ? '#cccccc' : '#000000'" />
																				</wd-cell>
																			</view>
					
																			<view @click.stop="handleJumpChange(notApproveItem.summarys > 0 ? '/projectPages/prjsummarypage/Index?pid=' + notApproveItem.id + '&pname=' + encodeURIComponent(notApproveItem.proname) : '')">
																				<wd-cell title="项目总结数" icon="a-controlplatform" custom-class="cellClass">
																					<wd-text bold :text="notApproveItem.summarys" size="14px" :color="notApproveItem.summarys === 0 ? '#cccccc' : '#000000'" />
																				</wd-cell>
																			</view>
					
																			<view @click.stop="handleJumpChange(notApproveItem.dailys > 0 ? '/mePages/technicalsupportdaily/Index?pid=' + notApproveItem.id + '&pname=' + encodeURIComponent(notApproveItem.proname) : '')">
																				<wd-cell title="日报数" icon="a-controlplatform" custom-class="cellClass">
																					<wd-text bold :text="notApproveItem.dailys" size="14px" :color="notApproveItem.dailys === 0 ? '#cccccc' : '#000000'" />
																				</wd-cell>
																			</view>
																			
																			<wd-cell title="开始时间" icon="time" custom-class="cellClass">
																				<wd-text bold :text="notApproveItem.sdbtime || '--'" size="14px"
																					:color="isDark ? '#ffffff' : '#000000'" />
																			</wd-cell>
																			
																			<wd-cell title="商务联系人" icon="user" custom-class="cellClass">
																				<wd-text bold :text="notApproveItem.businesscon" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
																			</wd-cell>
																			
																			<wd-cell v-if="notApproveItem.hasOwnProperty('plantime')" title="计划调试时间" icon="time" custom-class="cellClass">
																				<wd-text bold :text="notApproveItem.plantime" size="14px"
																					:color="isDark ? '#ffffff' : '#000000'" />
																			</wd-cell>
									
																			<!-- <wd-cell title="创建者" icon="user" custom-class="cellClass">
																				<wd-text bold :text="notApproveItem.username" size="14px"
																					:color="isDark ? '#ffffff' : '#000000'" />
																			</wd-cell>
									
																			<wd-cell title="创建时间" icon="time" custom-class="cellClass">
																				<wd-text bold :text="notApproveItem.dbtime" size="14px"
																					:color="isDark ? '#ffffff' : '#000000'" />
																			</wd-cell> -->
									
																			<view style="margin: 10rpx 0;">
																				<wd-progress color="#4d80f0" :percentage="notApproveItem.progess" />
																			</view>
																		</view>
									
																		<wd-gap bg-color="#cccccc" height="2rpx"></wd-gap>
																		<!-- <wd-gap bg-color="#cccccc" height="2rpx" v-if="hasPermission('project:Info:update') && (userType === 0 || ((userType === 2 || userType === 3) && (notApproveItem.status === 0 || notApproveItem.status === 2)) || (userType === 4 && notApproveItem.status === -1))"></wd-gap> -->
									
																		<!-- <wd-gap bg-color="#cccccc" height="2rpx" v-if="hasPermission('project:Info:update') && (userType === 0 || ((userType === 2 || userType === 3) && (notApproveItem.status === 0 || notApproveItem.status === 2))) && (notApproveItem.status === -1 || notApproveItem.status === 0 || notApproveItem.status === 2)"></wd-gap> -->
									
																		<view style="display: flex; justify-content: flex-end; margin-top: 10rpx; gap: 0 10rpx;">
																			<wd-button size="small" type="primary" :loading="loading" @click.stop="handleCanvasToImageChange(notApproveItem.id)">生成工程调试单</wd-button>
																			<wd-button size="small" type="primary" @click.stop="handleJumpChange('/projectPages/projectcontractpage/Index?id=' + notApproveItem.id)">关联合同</wd-button>
																			<wd-button v-if="hasPermission('project:Info:update') && notApproveItem.status === -1 && (userType === 0 || (userType === 4 && (userId === '1021' || userId === '1023')))" size="small" type="primary" @click.stop="handleCheckPrjChange(notApproveItem.id, 0)">核准</wd-button>
																			<wd-button v-if="hasPermission('project:Info:update') && notApproveItem.status === 0 && (userType === 0 || userType === 2 || userType === 3)" size="small" type="primary" @click.stop="handleCheckPrjChange(notApproveItem.id, 1)">启动</wd-button>
																			<wd-button v-if="hasPermission('project:Info:update') && notApproveItem.status === 2 && (userType === 0 || userType === 2)" size="small" type="primary" @click.stop="handleCheckPrjChange(notApproveItem.id, 3)">审核</wd-button>
																		</view>
																	</view>
																</view>
															</uni-swipe-action-item>
														</uni-swipe-action>
													</view>
													<view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
														<wd-status-tip image="../static/search.png" tip="暂无项目" />
													</view>
												</view>
									
												<view v-if="activeTab === 2">
													<view v-if="noStartDataList.length > 0">
														<uni-swipe-action>
															<uni-swipe-action-item v-for="(noStartItem, noStartIndex) in noStartDataList" :key="noStartIndex" :right-options="options" @click="handleDeleteProjectChange(noStartItem.id)">
																<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: noStartIndex === noStartDataList.length - 1 ? '20rpx 20rpx 40rpx 20rpx' : '20rpx 20rpx 0', borderRadius: '20rpx' }">
																	<view style="padding: 20rpx; ">
																		<view class="prjInfoHeader">
																			<view class="left">
																				<wd-text v-if="noStartItem.ptype === 0" bold :text="noStartItem.hasOwnProperty('dispatch') && noStartItem.dispatch ? noStartItem.proname + ' (' + noStartItem.dispatch + ')' : noStartItem.proname" size="15px" :color="isDark ? '#ffffff' : '#000000'" :lines="5" />
																				<wd-text v-if="noStartItem.ptype === 1" bold :text="noStartItem.hasOwnProperty('dispatch') && noStartItem.dispatch ? noStartItem.proname + ' (' + noStartItem.dispatch + ')' : noStartItem.proname" size="15px" type="warning" :lines="5" />
																				<wd-text v-if="noStartItem.ptype === 2" bold :text="noStartItem.hasOwnProperty('dispatch') && noStartItem.dispatch ? noStartItem.proname + ' (' + noStartItem.dispatch + ')' : noStartItem.proname" size="15px" type="error" :lines="5" />
																			</view>
																			<view class="right">
																				<wd-text bold :text="noStartItem.status === 0 ? '未开始' : noStartItem.status === 1 ? '进行中' : noStartItem.status === 2 ? '待审核' : noStartItem.status === 3 ? '已完成' : '未知'" size="14px" :type="noStartItem.status === 0 ? 'default' : noStartItem.status === 1 ? 'primary' : noStartItem.status === 2 ? 'warning' : noStartItem.status === 3 ? 'success' : 'default'" />
																				<wd-icon v-if="hasPermission('project:Info:update')" name="edit-outline" size="18px" @click.stop="handleJumpChange('/projectPages/addproject/Index?id=' + noStartItem.id)"></wd-icon>
																			</view>
																		</view>
									
																		<view @click="handleJumpPageChange(noStartItem.id, noStartItem.proname)">
																			<wd-cell title="周期(天)" icon="calendar" custom-class="cellClass">
																				<wd-text bold :text="noStartItem.period" size="14px"
																					:color="isDark ? '#ffffff' : '#000000'" />
																			</wd-cell>
									
																			<view v-if="hasPermission('project:DispatchContact:select')" @click.stop="handleJumpChange('/projectPages/diapatcherpage/Index?pid=' + noStartItem.id)">
																				<wd-cell title="调度信息" icon="transfer" custom-class="cellClass">
																					<wd-icon name="view" size="22px"></wd-icon>
																				</wd-cell>
																			</view>
									
																			<wd-cell title="调试类型" icon="list" custom-class="cellClass">
																				<wd-tag type="primary" round>
																					{{ noStartItem.dtype === 0 ? '现场调试' : noStartItem.dtype === 1 ? '远程调试' : noStartItem.dtype === 2 ? '无需调试' : '未知' }}
																				</wd-tag>
																			</wd-cell>
																			
																			<view @click.stop="handleJumpChange(noStartItem.debugs > 0 ? '/projectPages/projectdetail/Index?pid=' + noStartItem.id + '&activeTab=2' : '')">
																				<wd-cell title="调试任务数" icon="a-controlplatform" custom-class="cellClass">
																					<wd-text bold :text="noStartItem.debugs" size="14px" :color="noStartItem.debugs === 0 ? '#cccccc' : '#000000'" />
																				</wd-cell>
																			</view>
					
																			<view @click.stop="handleJumpChange(noStartItem.summarys > 0 ? '/projectPages/prjsummarypage/Index?pid=' + noStartItem.id + '&pname=' + encodeURIComponent(noStartItem.proname) : '')">
																				<wd-cell title="项目总结数" icon="a-controlplatform" custom-class="cellClass">
																					<wd-text bold :text="noStartItem.summarys" size="14px" :color="noStartItem.summarys === 0 ? '#cccccc' : '#000000'" />
																				</wd-cell>
																			</view>
					
																			<view @click.stop="handleJumpChange(noStartItem.dailys > 0 ? '/mePages/technicalsupportdaily/Index?pid=' + noStartItem.id + '&pname=' + encodeURIComponent(noStartItem.proname) : '')">
																				<wd-cell title="日报数" icon="a-controlplatform" custom-class="cellClass">
																					<wd-text bold :text="noStartItem.dailys" size="14px" :color="noStartItem.dailys === 0 ? '#cccccc' : '#000000'" />
																				</wd-cell>
																			</view>
																			
																			<wd-cell title="开始时间" icon="time" custom-class="cellClass">
																				<wd-text bold :text="noStartItem.sdbtime || '--'" size="14px"
																					:color="isDark ? '#ffffff' : '#000000'" />
																			</wd-cell>
																			
																			<wd-cell title="商务联系人" icon="user" custom-class="cellClass">
																				<wd-text bold :text="noStartItem.businesscon" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
																			</wd-cell>
																			
																			<wd-cell v-if="noStartItem.hasOwnProperty('plantime')" title="计划调试时间" icon="time" custom-class="cellClass">
																				<wd-text bold :text="noStartItem.plantime" size="14px"
																					:color="isDark ? '#ffffff' : '#000000'" />
																			</wd-cell>
									
																			<!-- <wd-cell title="创建者" icon="user" custom-class="cellClass">
																				<wd-text bold :text="noStartItem.username" size="14px"
																					:color="isDark ? '#ffffff' : '#000000'" />
																			</wd-cell>
									
																			<wd-cell title="创建时间" icon="time" custom-class="cellClass">
																				<wd-text bold :text="noStartItem.dbtime" size="14px"
																					:color="isDark ? '#ffffff' : '#000000'" />
																			</wd-cell> -->
									
																			<view style="margin: 10rpx 0;">
																				<wd-progress color="#4d80f0" :percentage="noStartItem.progess" />
																			</view>
																		</view>
									
																		<wd-gap bg-color="#cccccc" height="2rpx"></wd-gap>
																		<!-- <wd-gap bg-color="#cccccc" height="2rpx" v-if="hasPermission('project:Info:update') && (userType === 0 || userType === 2 || userType === 3) && noStartItem.status === 0"></wd-gap> -->
									
																		<view style="display: flex; justify-content: flex-end; margin-top: 10rpx; gap: 0 10rpx;">
																			<wd-button size="small" type="primary" :loading="loading" @click.stop="handleCanvasToImageChange(noStartItem.id)">生成工程调试单</wd-button>
																			<wd-button size="small" type="primary" @click.stop="handleJumpChange('/projectPages/projectcontractpage/Index?id=' + noStartItem.id)">关联合同</wd-button>
																			<wd-button v-if="hasPermission('project:Info:update') && (userType === 0 || userType === 2 || userType === 3) && noStartItem.status === 0" size="small" type="primary" @click.stop="handleCheckPrjChange(noStartItem.id, 1)">启动</wd-button>
																		</view>
																	</view>
																</view>
															</uni-swipe-action-item>
														</uni-swipe-action>
													</view>
													<view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
														<wd-status-tip image="../static/search.png" tip="暂无项目" />
													</view>
												</view>
									
												<view v-if="activeTab === 3">
													<view v-if="progressingDataList.length > 0">
														<uni-swipe-action>
															<uni-swipe-action-item v-for="(progressingItem, progressingIndex) in progressingDataList" :key="progressingIndex" :right-options="options" @click="handleDeleteProjectChange(progressingItem.id)">
																<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: progressingIndex === progressingDataList.length - 1 ? '20rpx 20rpx 40rpx 20rpx' : '20rpx 20rpx 0', borderRadius: '20rpx' }">
																	<view style="padding: 20rpx; ">
																		<view class="prjInfoHeader">
																			<view class="left">
																				<wd-text v-if="progressingItem.ptype === 0" bold :text="progressingItem.hasOwnProperty('dispatch') && progressingItem.dispatch ? progressingItem.proname + ' (' + progressingItem.dispatch + ')' : progressingItem.proname" size="15px" :color="isDark ? '#ffffff' : '#000000'" :lines="5" />
																				<wd-text v-if="progressingItem.ptype === 1" bold :text="progressingItem.hasOwnProperty('dispatch') && progressingItem.dispatch ? progressingItem.proname + ' (' + progressingItem.dispatch + ')' : progressingItem.proname" size="15px" type="warning" :lines="5" />
																				<wd-text v-if="progressingItem.ptype === 2" bold :text="progressingItem.hasOwnProperty('dispatch') && progressingItem.dispatch ? progressingItem.proname + ' (' + progressingItem.dispatch + ')' : progressingItem.proname" size="15px" type="error" :lines="5" />
																			</view>
																			<view class="right">
																				<wd-text bold :text="progressingItem.status === 0 ? '未开始' : progressingItem.status === 1 ? '进行中' : progressingItem.status === 2 ? '待审核' : progressingItem.status === 3 ? '已完成' : '未知'" size="14px" :type="progressingItem.status === 0 ? 'default' : progressingItem.status === 1 ? 'primary' : progressingItem.status === 2 ? 'warning' : progressingItem.status === 3 ? 'success' : 'default'" />
																				<wd-icon v-if="hasPermission('project:Info:update')" name="edit-outline" size="18px" @click.stop="handleJumpChange('/projectPages/addproject/Index?id=' + progressingItem.id)"></wd-icon>
																			</view>
																		</view>
									
																		<view @click="handleJumpPageChange(progressingItem.id, progressingItem.proname)">
																			<wd-cell title="周期(天)" icon="calendar" custom-class="cellClass">
																				<wd-text bold :text="progressingItem.period" size="14px"
																					:color="isDark ? '#ffffff' : '#000000'" />
																			</wd-cell>
									
																			<view v-if="hasPermission('project:DispatchContact:select')" @click.stop="handleJumpChange('/projectPages/diapatcherpage/Index?pid=' + progressingItem.id)">
																				<wd-cell title="调度信息" icon="transfer" custom-class="cellClass">
																					<wd-icon name="view" size="22px"></wd-icon>
																				</wd-cell>
																			</view>
									
																			<wd-cell title="调试类型" icon="list" custom-class="cellClass">
																				<wd-tag type="primary" round>
																					{{ progressingItem.dtype === 0 ? '现场调试' : progressingItem.dtype === 1 ? '远程调试' : progressingItem.dtype === 2 ? '无需调试' : '未知' }}
																				</wd-tag>
																			</wd-cell>
																			
																			<view @click.stop="handleJumpChange(progressingItem.debugs > 0 ? '/projectPages/projectdetail/Index?pid=' + progressingItem.id + '&activeTab=2' : '')">
																				<wd-cell title="调试任务数" icon="a-controlplatform" custom-class="cellClass">
																					<wd-text bold :text="progressingItem.debugs" size="14px" :color="progressingItem.debugs === 0 ? '#cccccc' : '#000000'" />
																				</wd-cell>
																			</view>
					
																			<view @click.stop="handleJumpChange(progressingItem.summarys > 0 ? '/projectPages/prjsummarypage/Index?pid=' + progressingItem.id + '&pname=' + encodeURIComponent(progressingItem.proname) : '')">
																				<wd-cell title="项目总结数" icon="a-controlplatform" custom-class="cellClass">
																					<wd-text bold :text="progressingItem.summarys" size="14px" :color="progressingItem.summarys === 0 ? '#cccccc' : '#000000'" />
																				</wd-cell>
																			</view>
					
																			<view @click.stop="handleJumpChange(progressingItem.dailys > 0 ? '/mePages/technicalsupportdaily/Index?pid=' + progressingItem.id + '&pname=' + encodeURIComponent(progressingItem.proname) : '')">
																				<wd-cell title="日报数" icon="a-controlplatform" custom-class="cellClass">
																					<wd-text bold :text="progressingItem.dailys" size="14px" :color="progressingItem.dailys === 0 ? '#cccccc' : '#000000'" />
																				</wd-cell>
																			</view>
																			
																			<wd-cell title="开始时间" icon="time" custom-class="cellClass">
																				<wd-text bold :text="progressingItem.sdbtime || '--'" size="14px"
																					:color="isDark ? '#ffffff' : '#000000'" />
																			</wd-cell>
																			
																			<wd-cell title="商务联系人" icon="user" custom-class="cellClass">
																				<wd-text bold :text="progressingItem.businesscon" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
																			</wd-cell>
																			
																			<wd-cell v-if="progressingItem.hasOwnProperty('plantime')" title="计划调试时间" icon="time" custom-class="cellClass">
																				<wd-text bold :text="progressingItem.plantime" size="14px"
																					:color="isDark ? '#ffffff' : '#000000'" />
																			</wd-cell>
									
																			<!-- <wd-cell title="创建者" icon="user" custom-class="cellClass">
																				<wd-text bold :text="progressingItem.username" size="14px"
																					:color="isDark ? '#ffffff' : '#000000'" />
																			</wd-cell>
									
																			<wd-cell title="创建时间" icon="time" custom-class="cellClass">
																				<wd-text bold :text="progressingItem.dbtime" size="14px"
																					:color="isDark ? '#ffffff' : '#000000'" />
																			</wd-cell> -->
									
																			<view style="margin: 10rpx 0;">
																				<wd-progress color="#4d80f0" :percentage="progressingItem.progess" />
																			</view>
																			
																			<wd-gap bg-color="#cccccc" height="2rpx"></wd-gap>
																			
																			<view style="display: flex; justify-content: flex-end; margin-top: 10rpx; gap: 0 10rpx;">
																				<wd-button size="small" type="primary" :loading="loading" @click.stop="handleCanvasToImageChange(progressingItem.id)">生成工程调试单</wd-button>
																				<wd-button size="small" type="primary" @click.stop="handleJumpChange('/projectPages/projectcontractpage/Index?id=' + progressingItem.id)">关联合同</wd-button>
																			</view>
																		</view>
																	</view>
																</view>
															</uni-swipe-action-item>
														</uni-swipe-action>
													</view>
													<view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
														<wd-status-tip image="../static/search.png" tip="暂无项目" />
													</view>
												</view>
									
												<view v-if="activeTab === 4">
													<view v-if="auditDataList.length > 0">
														<uni-swipe-action>
															<uni-swipe-action-item v-for="(auditItem, auditIndex) in auditDataList" :key="auditIndex" :right-options="options" @click="handleDeleteProjectChange(auditItem.id)">
																<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: auditIndex === auditDataList.length - 1 ? '20rpx 20rpx 40rpx 20rpx' : '20rpx 20rpx 0', borderRadius: '20rpx' }">
																	<view style="padding: 20rpx; ">
																		<view class="prjInfoHeader">
																			<view class="left">
																				<wd-text v-if="auditItem.ptype === 0" bold :text="auditItem.hasOwnProperty('dispatch') && auditItem.dispatch ? auditItem.proname + ' (' + auditItem.dispatch + ')' : auditItem.proname" size="15px" :color="isDark ? '#ffffff' : '#000000'" :lines="5" />
																				<wd-text v-if="auditItem.ptype === 1" bold :text="auditItem.hasOwnProperty('dispatch') && auditItem.dispatch ? auditItem.proname + ' (' + auditItem.dispatch + ')' : auditItem.proname" size="15px" type="warning" :lines="5" />
																				<wd-text v-if="auditItem.ptype === 2" bold :text="auditItem.hasOwnProperty('dispatch') && auditItem.dispatch ? auditItem.proname + ' (' + auditItem.dispatch + ')' : auditItem.proname" size="15px" type="error" :lines="5" />
																			</view>
																			<view class="right">
																				<wd-text bold :text="auditItem.status === 0 ? '未开始' : auditItem.status === 1 ? '进行中' : auditItem.status === 2 ? '待审核' : auditItem.status === 3 ? '已完成' : '未知'" size="14px" :type="auditItem.status === 0 ? 'default' : auditItem.status === 1 ? 'primary' : auditItem.status === 2 ? 'warning' : auditItem.status === 3 ? 'success' : 'default'" />
																				<wd-icon v-if="hasPermission('project:Info:update')" name="edit-outline" size="18px" @click.stop="handleJumpChange('/projectPages/addproject/Index?id=' + auditItem.id)"></wd-icon>
																			</view>
																		</view>
									
																		<view @click="handleJumpPageChange(auditItem.id, auditItem.proname)">
																			<wd-cell title="周期(天)" icon="calendar" custom-class="cellClass">
																				<wd-text bold :text="auditItem.period" size="14px"
																					:color="isDark ? '#ffffff' : '#000000'" />
																			</wd-cell>
									
																			<view v-if="hasPermission('project:DispatchContact:select')" @click.stop="handleJumpChange('/projectPages/diapatcherpage/Index?pid=' + auditItem.id)">
																				<wd-cell title="调度信息" icon="transfer" custom-class="cellClass">
																					<wd-icon name="view" size="22px"></wd-icon>
																				</wd-cell>
																			</view>
									
																			<wd-cell title="调试类型" icon="list" custom-class="cellClass">
																				<wd-tag type="primary" round>
																					{{ auditItem.dtype === 0 ? '现场调试' : auditItem.dtype === 1 ? '远程调试' : auditItem.dtype === 2 ? '无需调试' : '未知' }}
																				</wd-tag>
																			</wd-cell>
																			
																			<view @click.stop="handleJumpChange(auditItem.debugs > 0 ? '/projectPages/projectdetail/Index?pid=' + auditItem.id + '&activeTab=2' : '')">
																				<wd-cell title="调试任务数" icon="a-controlplatform" custom-class="cellClass">
																					<wd-text bold :text="auditItem.debugs" size="14px" :color="auditItem.debugs === 0 ? '#cccccc' : '#000000'" />
																				</wd-cell>
																			</view>
					
																			<view @click.stop="handleJumpChange(auditItem.summarys > 0 ? '/projectPages/prjsummarypage/Index?pid=' + auditItem.id + '&pname=' + encodeURIComponent(auditItem.proname) : '')">
																				<wd-cell title="项目总结数" icon="a-controlplatform" custom-class="cellClass">
																					<wd-text bold :text="auditItem.summarys" size="14px" :color="auditItem.summarys === 0 ? '#cccccc' : '#000000'" />
																				</wd-cell>
																			</view>
					
																			<view @click.stop="handleJumpChange(auditItem.dailys > 0 ? '/mePages/technicalsupportdaily/Index?pid=' + auditItem.id + '&pname=' + encodeURIComponent(auditItem.proname) : '')">
																				<wd-cell title="日报数" icon="a-controlplatform" custom-class="cellClass">
																					<wd-text bold :text="auditItem.dailys" size="14px" :color="auditItem.dailys === 0 ? '#cccccc' : '#000000'" />
																				</wd-cell>
																			</view>
																			
																			<wd-cell title="开始时间" icon="time" custom-class="cellClass">
																				<wd-text bold :text="auditItem.sdbtime || '--'" size="14px"
																					:color="isDark ? '#ffffff' : '#000000'" />
																			</wd-cell>
																			
																			<wd-cell title="商务联系人" icon="user" custom-class="cellClass">
																				<wd-text bold :text="auditItem.businesscon" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
																			</wd-cell>
																			
																			<wd-cell v-if="auditItem.hasOwnProperty('plantime')" title="计划调试时间" icon="time" custom-class="cellClass">
																				<wd-text bold :text="auditItem.plantime" size="14px"
																					:color="isDark ? '#ffffff' : '#000000'" />
																			</wd-cell>
									
																			<!-- <wd-cell title="创建者" icon="user" custom-class="cellClass">
																				<wd-text bold :text="auditItem.username" size="14px"
																					:color="isDark ? '#ffffff' : '#000000'" />
																			</wd-cell>
									
																			<wd-cell title="创建时间" icon="time" custom-class="cellClass">
																				<wd-text bold :text="auditItem.dbtime" size="14px"
																					:color="isDark ? '#ffffff' : '#000000'" />
																			</wd-cell> -->
									
																			<view style="margin: 10rpx 0;">
																				<wd-progress color="#4d80f0" :percentage="auditItem.progess" />
																			</view>
																		</view>
									
																		<wd-gap bg-color="#cccccc" height="2rpx"></wd-gap>
																		<!-- <wd-gap bg-color="#cccccc" height="2rpx" v-if="hasPermission('project:Info:update') && (userType === 0 || userType === 2) && auditItem.status === 2"></wd-gap> -->
									
																		<view style="display: flex; justify-content: flex-end; margin-top: 10rpx; gap: 0 10rpx;">
																			<wd-button size="small" type="primary" :loading="loading" @click.stop="handleCanvasToImageChange(auditItem.id)">生成工程调试单</wd-button>
																			<wd-button size="small" type="primary" @click.stop="handleJumpChange('/projectPages/projectcontractpage/Index?id=' + auditItem.id)">关联合同</wd-button>
																			<wd-button v-if="hasPermission('project:Info:update') && (userType === 0 || userType === 2) && auditItem.status === 2" size="small" type="primary" @click.stop="handleCheckPrjChange(auditItem.id, 3)">审核</wd-button>
																		</view>
																	</view>
																</view>
															</uni-swipe-action-item>
														</uni-swipe-action>
													</view>
													<view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
														<wd-status-tip image="../static/search.png" tip="暂无项目" />
													</view>
												</view>
									
												<view v-if="activeTab === 5">
													<view v-if="completeDataList.length > 0">
														<uni-swipe-action>
															<uni-swipe-action-item v-for="(completeItem, completeIndex) in completeDataList" :key="completeIndex" :right-options="options" @click="handleDeleteProjectChange(completeItem.id)">
																<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: completeIndex === completeDataList.length - 1 ? '20rpx 20rpx 40rpx 20rpx' : '20rpx', borderRadius: '20rpx' }">
																	<view style="padding: 20rpx; ">
																		<view class="prjInfoHeader">
																			<view class="left">
																				<wd-text v-if="completeItem.ptype === 0" bold :text="completeItem.hasOwnProperty('dispatch') && completeItem.dispatch ? completeItem.proname + ' (' + completeItem.dispatch + ')' : completeItem.proname" size="15px" :color="isDark ? '#ffffff' : '#000000'" :lines="5" />
																				<wd-text v-if="completeItem.ptype === 1" bold :text="completeItem.hasOwnProperty('dispatch') && completeItem.dispatch ? completeItem.proname + ' (' + completeItem.dispatch + ')' : completeItem.proname" size="15px" type="warning" :lines="5" />
																				<wd-text v-if="completeItem.ptype === 2" bold :text="completeItem.hasOwnProperty('dispatch') && completeItem.dispatch ? completeItem.proname + ' (' + completeItem.dispatch + ')' : completeItem.proname" size="15px" type="error" :lines="5" />
																			</view>
																			<view class="right">
																				<wd-text bold :text="completeItem.status === 0 ? '未开始' : completeItem.status === 1 ? '进行中' : completeItem.status === 2 ? '待审核' : completeItem.status === 3 ? '已完成' : '未知'" size="14px" :type="completeItem.status === 0 ? 'default' : completeItem.status === 1 ? 'primary' : completeItem.status === 2 ? 'warning' : completeItem.status === 3 ? 'success' : 'default'" />
																				<wd-icon v-if="hasPermission('project:Info:update')" name="edit-outline" size="18px" @click.stop="handleJumpChange('/projectPages/addproject/Index?id=' + completeItem.id)"></wd-icon>
																			</view>
																		</view>
									
																		<view  @click="handleJumpPageChange(completeItem.id, completeItem.proname)">
																			<wd-cell title="周期(天)" icon="calendar" custom-class="cellClass">
																				<wd-text bold :text="completeItem.period" size="14px"
																					:color="isDark ? '#ffffff' : '#000000'" />
																			</wd-cell>
									
																			<view v-if="hasPermission('project:DispatchContact:select')" @click.stop="handleJumpChange('/projectPages/diapatcherpage/Index?pid=' + completeItem.id)">
																				<wd-cell title="调度信息" icon="transfer" custom-class="cellClass">
																					<wd-icon name="view" size="22px"></wd-icon>
																				</wd-cell>
																			</view>
									
																			<wd-cell title="调试类型" icon="list" custom-class="cellClass">
																				<wd-tag type="primary" round>
																					{{ completeItem.dtype === 0 ? '现场调试' : completeItem.dtype === 1 ? '远程调试' : completeItem.dtype === 2 ? '无需调试' : '未知' }}
																				</wd-tag>
																			</wd-cell>
																			
																			<view @click.stop="handleJumpChange(completeItem.debugs > 0 ? '/projectPages/projectdetail/Index?pid=' + completeItem.id + '&activeTab=2' : '')">
																				<wd-cell title="调试任务数" icon="a-controlplatform" custom-class="cellClass">
																					<wd-text bold :text="completeItem.debugs" size="14px" :color="completeItem.debugs === 0 ? '#cccccc' : '#000000'" />
																				</wd-cell>
																			</view>
					
																			<view @click.stop="handleJumpChange(completeItem.summarys > 0 ? '/projectPages/prjsummarypage/Index?pid=' + completeItem.id + '&pname=' + encodeURIComponent(completeItem.proname) : '')">
																				<wd-cell title="项目总结数" icon="a-controlplatform" custom-class="cellClass">
																					<wd-text bold :text="completeItem.summarys" size="14px" :color="completeItem.summarys === 0 ? '#cccccc' : '#000000'" />
																				</wd-cell>
																			</view>
					
																			<view @click.stop="handleJumpChange(completeItem.dailys > 0 ? '/mePages/technicalsupportdaily/Index?pid=' + completeItem.id + '&pname=' + encodeURIComponent(completeItem.proname) : '')">
																				<wd-cell title="日报数" icon="a-controlplatform" custom-class="cellClass">
																					<wd-text bold :text="completeItem.dailys" size="14px" :color="completeItem.dailys === 0 ? '#cccccc' : '#000000'" />
																				</wd-cell>
																			</view>
					
																			<wd-cell title="开始时间" icon="time" custom-class="cellClass">
																				<wd-text bold :text="completeItem.sdbtime || '--'" size="14px"
																					:color="isDark ? '#ffffff' : '#000000'" />
																			</wd-cell>
									
																			<wd-cell v-if="completeItem.status === 3 && completeItem.ckusername" title="验收人" icon="user" custom-class="cellClass">
																				<wd-text bold :text="completeItem.ckusername" size="14px"
																					:color="isDark ? '#ffffff' : '#000000'" />
																			</wd-cell>
									
																			<wd-cell v-if="completeItem.status === 3 && completeItem.ckdbtime" title="验收时间" icon="time" custom-class="cellClass">
																				<wd-text bold :text="completeItem.ckdbtime" size="14px"
																					:color="isDark ? '#ffffff' : '#000000'" />
																			</wd-cell>
																			
																			<wd-cell title="商务联系人" icon="user" custom-class="cellClass">
																				<wd-text bold :text="completeItem.businesscon" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
																			</wd-cell>
																			
																			<wd-cell v-if="completeItem.hasOwnProperty('plantime')" title="计划调试时间" icon="time" custom-class="cellClass">
																				<wd-text bold :text="completeItem.plantime" size="14px"
																					:color="isDark ? '#ffffff' : '#000000'" />
																			</wd-cell>
									
																			<!-- <wd-cell title="创建者" icon="user" custom-class="cellClass">
																				<wd-text bold :text="completeItem.username" size="14px"
																					:color="isDark ? '#ffffff' : '#000000'" />
																			</wd-cell>
									
																			<wd-cell title="创建时间" icon="time" custom-class="cellClass">
																				<wd-text bold :text="completeItem.dbtime" size="14px"
																					:color="isDark ? '#ffffff' : '#000000'" />
																			</wd-cell> -->
									
																			<view style="margin: 10rpx 0;">
																				<wd-progress color="#4d80f0" :percentage="completeItem.progess" />
																			</view>
																			
																			<wd-gap bg-color="#cccccc" height="2rpx"></wd-gap>
																			
																			<view style="display: flex; justify-content: flex-end; margin-top: 10rpx; gap: 0 10rpx;">
																				<wd-button size="small" type="primary" :loading="loading" @click.stop="handleCanvasToImageChange(completeItem.id)">生成工程调试单</wd-button>
																				<wd-button size="small" type="primary" @click.stop="handleJumpChange('/projectPages/projectcontractpage/Index?id=' + completeItem.id)">关联合同</wd-button>
																			</view>
																		</view>
																	</view>
																</view>
															</uni-swipe-action-item>
														</uni-swipe-action>
													</view>
													<view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
														<wd-status-tip image="../static/search.png" tip="暂无项目" />
													</view>
												</view>
											</scroll-view>
										</wd-tab>
									</wd-tabs>
								</view>
							</scroll-view>
						</wd-tab>
					</wd-tabs>
				</view>
				
				<view v-else>
					<!-- 搜索框 -->
					<wd-search v-model="dataForm.fuzzy" placeholder="请输入项目名或客户名称" placeholder-left :placeholderClass="isDark ? 'whiteClass' : 'greyClass'"
						cancel-txt="搜索" @search="handleSearchChange" @cancel="handleSearchChange" @clear="handleClearChange" />
					<wd-drop-menu>
						<wd-drop-menu-item v-model="provinceInfo.selectProvince" :options="provinceInfo.provinceData" value-key="id" label-key="name" @change="getRegionDataInfo" />
						<!-- <wd-drop-menu-item v-model="provinceInfo.selectRegion" :options="provinceInfo.regionData" value-key="id" label-key="name"></wd-drop-menu-item> -->
						<wd-drop-menu-item title="全部地区">
							<wd-radio-group v-model="provinceInfo.selectRegionType" shape="button" v-if="provinceInfo.regionData.length > 0" cell @change="handleCheckRegionChange">
								<wd-radio :value="1">全选</wd-radio>
								<wd-radio :value="2">全不选</wd-radio>
							</wd-radio-group>
									
							<wd-checkbox-group v-model="provinceInfo.selectRegion" cell>
								<wd-checkbox v-for="(regionItem, regionIndex) in provinceInfo.regionData" :key="regionIndex" :modelValue="regionItem.id">
									{{ regionItem.name }}
								</wd-checkbox>
							</wd-checkbox-group>
						</wd-drop-menu-item>
						
						<wd-drop-menu-item ref="dropMenuRef" title="更多条件">
							<view style="display: flex; justify-content: left; align-items: center; justify-content: space-between; flex-wrap: nowrap; padding: 10px 0 10rpx 10px; width: calc(100vw - 60rpx);">
								<view style="display: flex; align-items: center;">
									<view style="width: 5px; height: 15px; background: #0055FE;"></view>
									<view style="margin-left: 10rpx; font-weight: bolder;">进度状态</view>
								</view>
							</view>
							<wd-radio-group v-model="ptype" shape="button" cell>
								<wd-radio :value="-1">全部</wd-radio>
								<wd-radio :value="0">正常</wd-radio>
								<wd-radio :value="1">延期</wd-radio>
								<wd-radio :value="2">作废</wd-radio>
							</wd-radio-group>
							
							<view style="display: flex; justify-content: left; align-items: center; justify-content: space-between; flex-wrap: nowrap; padding: 10px 0 10rpx 10px; width: calc(100vw - 60rpx);">
								<view style="display: flex; align-items: center;">
									<view style="width: 5px; height: 15px; background: #0055FE;"></view>
									<view style="margin-left: 10rpx; font-weight: bolder;">调试类型</view>
								</view>
							</view>
							<wd-radio-group v-model="debugType" shape="button" cell>
								<wd-radio :value="-1">全部</wd-radio>
								<wd-radio :value="0">现场调试</wd-radio>
								<wd-radio :value="1">远程调试</wd-radio>
								<wd-radio :value="2">无需调试</wd-radio>
							</wd-radio-group>
							
							<view style="display: flex; justify-content: left; align-items: center; justify-content: space-between; flex-wrap: nowrap; padding: 10px 0 10rpx 10px; width: calc(100vw - 60rpx);">
								<view style="display: flex; align-items: center;">
									<view style="width: 5px; height: 15px; background: #0055FE;"></view>
									<view style="margin-left: 10rpx; font-weight: bolder;">起止时间</view>
								</view>
							</view>
							
							<view style="display: flex; justify-content: left; align-items: center; justify-content: space-between; flex-wrap: nowrap; padding: 10px 0 10rpx 10px; width: calc(100vw - 60rpx);" v-if="userType !== 3">
								<view style="display: flex; align-items: center;">
									<view style="width: 5px; height: 15px; background: #0055FE;"></view>
									<view style="margin-left: 10rpx; font-weight: bolder;">参与人</view>
								</view>
							</view>
							
							<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', padding: '10rpx 20rpx', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0 10rpx' }" v-if="userType !== 3">
								<wd-input disabled v-model="dataForm.participantname" placeholder="请选择参与人" custom-style="width: calc(100vw - 40rpx)">
								    <template #suffix>
								        <wd-button icon="link" size="small" @click.stop="handleLinkUserShowChange">参与人</wd-button>
								    </template>
								</wd-input>
								
								<wd-icon v-if="dataForm.participantname" size="30rpx" name="close-circle" @click.stop="handleClearUserParticipantnameChange"></wd-icon>
							</view>
							
							<view style="display: flex; align-items: center; justify-content: space-between; width: 100vw;">
								<wd-datetime-picker use-second :z-index="9999" v-model="rangeTime" custom-style="width: calc(100vw - 40rpx);" />
								<wd-button v-if="rangeTime && rangeTime.length > 0" type="icon" icon="close-circle" custom-class="closeButtonWrap" @click="handleClearRangeTimeChange"></wd-button>
							</view>
							
							<view style="display: flex; justify-content: center; align-items: center; margin: 10rpx; gap: 0 10rpx;">
								<wd-button type="error" @click="handleSelectClearChange" custom-class="filterButton">清空</wd-button>
								<wd-button type="primary" @click="handleSelectConfirmChange" custom-class="filterButton">确定</wd-button>
							</view>
						</wd-drop-menu-item>
						
						<!-- <wd-drop-menu-item ref="dropMenuRef" :title="ptype === -1 ? '全部进度' : ptype === 0 ? '正常' : ptype === 1 ? '延期' : '未知'">
							<wd-radio-group v-model="ptype" shape="button" cell @change="handleSelectProgressChange">
								<wd-radio :value="-1">全部</wd-radio>
								<wd-radio :value="0">正常</wd-radio>
								<wd-radio :value="1">延期</wd-radio>
							</wd-radio-group>
						</wd-drop-menu-item> -->
					</wd-drop-menu>
					
					<!-- tabs -->
					<wd-tabs v-model="activeTab" animated @change="handleTabsChange">
						<wd-tab v-for="(item, index) in tabsList" :key="index" :title="item.title">
							<scroll-view :scroll-y="true" :scroll-top="scrollTop" :style="{ height: scrollViewHeight + 'px' }" @scroll="handleScrollChange" @scrolltolower="handleScrollTolowerChange">
								<view v-if="activeTab === 0">
									<view v-if="dataList.length > 0">
										<uni-swipe-action>
											<uni-swipe-action-item v-for="(dataItem, dataIndex) in dataList" :key="dataIndex" :right-options="options" @click="handleDeleteProjectChange(dataItem.id)">
												<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: dataIndex === dataList.length - 1 ? '20rpx 20rpx 40rpx 20rpx' : '20rpx 20rpx 0', borderRadius: '20rpx' }">
													<view style="padding: 20rpx; ">
														<view class="prjInfoHeader">
															<view class="left">
																<wd-text v-if="dataItem.ptype === 0" bold :text="dataItem.hasOwnProperty('dispatch') && dataItem.dispatch ? dataItem.proname + ' (' + dataItem.dispatch + ')' : dataItem.proname" size="15px" :color="isDark ? '#ffffff' : '#000000'" :lines="5" />
																<wd-text v-if="dataItem.ptype === 1" bold :text="dataItem.hasOwnProperty('dispatch') && dataItem.dispatch ? dataItem.proname + ' (' + dataItem.dispatch + ')' : dataItem.proname" size="15px" type="warning" :lines="5" />
																<wd-text v-if="dataItem.ptype === 2" bold :text="dataItem.hasOwnProperty('dispatch') && dataItem.dispatch ? dataItem.proname + ' (' + dataItem.dispatch + ')' : dataItem.proname" size="15px" type="error" :lines="5" />
															</view>
															<view class="right">
																<wd-text bold :text="dataItem.status === -1 ? '未核准' : dataItem.status === 0 ? '未开始' : dataItem.status === 1 ? '进行中' : dataItem.status === 2 ? '待审核' : dataItem.status === 3 ? '已完成' : '未知'" size="14px" :type="dataItem.status === 0 ? 'default' : dataItem.status === 1 ? 'primary' : dataItem.status === 2 ? 'warning' : dataItem.status === 3 ? 'success' : 'default'" />
																<wd-icon v-if="hasPermission('project:Info:update')" name="edit-outline" size="18px" @click.stop="handleJumpChange('/projectPages/addproject/Index?id=' + dataItem.id)"></wd-icon>
															</view>
														</view>
					
														<view @click="handleJumpPageChange(dataItem.id, dataItem.proname)">
															<wd-cell title="周期(天)" icon="calendar" custom-class="cellClass">
																<wd-text bold :text="dataItem.period" size="14px"
																	:color="isDark ? '#ffffff' : '#000000'" />
															</wd-cell>
					
															<view v-if="hasPermission('project:DispatchContact:select')" @click.stop="handleJumpChange('/projectPages/diapatcherpage/Index?pid=' + dataItem.id)">
																<wd-cell title="调度信息" icon="transfer" custom-class="cellClass">
																	<wd-icon name="view" size="22px"></wd-icon>
																</wd-cell>
															</view>
					
															<wd-cell title="调试类型" icon="list" custom-class="cellClass">
																<wd-tag type="primary" round>
																	{{ dataItem.dtype === 0 ? '现场调试' : dataItem.dtype === 1 ? '远程调试' : dataItem.dtype === 2 ? '无需调试' : '未知' }}
																</wd-tag>
															</wd-cell>
															
															<view @click.stop="handleJumpChange(dataItem.debugs > 0 ? '/projectPages/projectdetail/Index?pid=' + dataItem.id + '&activeTab=2' : '')">
																<wd-cell title="调试任务数" icon="a-controlplatform" custom-class="cellClass">
																	<wd-text bold :text="dataItem.debugs" size="14px" :color="dataItem.debugs === 0 ? '#cccccc' : '#000000'" />
																</wd-cell>
															</view>
									
															<view @click.stop="handleJumpChange(dataItem.summarys > 0 ? '/projectPages/prjsummarypage/Index?pid=' + dataItem.id + '&pname=' + encodeURIComponent(dataItem.proname) : '')">
																<wd-cell title="项目总结数" icon="a-controlplatform" custom-class="cellClass">
																	<wd-text bold :text="dataItem.summarys" size="14px" :color="dataItem.summarys === 0 ? '#cccccc' : '#000000'" />
																</wd-cell>
															</view>
									
															<view @click.stop="handleJumpChange(dataItem.dailys > 0 ? '/mePages/technicalsupportdaily/Index?pid=' + dataItem.id + '&pname=' + encodeURIComponent(dataItem.proname) : '')">
																<wd-cell title="日报数" icon="a-controlplatform" custom-class="cellClass">
																	<wd-text bold :text="dataItem.dailys" size="14px" :color="dataItem.dailys === 0 ? '#cccccc' : '#000000'" />
																</wd-cell>
															</view>
															
															<wd-cell title="开始时间" icon="time" custom-class="cellClass">
																<wd-text bold :text="dataItem.sdbtime || '--'" size="14px"
																	:color="isDark ? '#ffffff' : '#000000'" />
															</wd-cell>
					
															<wd-cell v-if="dataItem.status === 3 && dataItem.ckusername" title="验收人" icon="user" custom-class="cellClass">
																<wd-text bold :text="dataItem.ckusername" size="14px"
																	:color="isDark ? '#ffffff' : '#000000'" />
															</wd-cell>
					
															<wd-cell v-if="dataItem.status === 3 && dataItem.ckdbtime" title="验收时间" icon="time" custom-class="cellClass">
																<wd-text bold :text="dataItem.ckdbtime" size="14px"
																	:color="isDark ? '#ffffff' : '#000000'" />
															</wd-cell>
															
															<wd-cell title="商务联系人" icon="user" custom-class="cellClass">
																<wd-text bold :text="dataItem.businesscon" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
															</wd-cell>
															
															<wd-cell v-if="dataItem.hasOwnProperty('plantime')" title="计划调试时间" icon="time" custom-class="cellClass">
																<wd-text bold :text="dataItem.plantime" size="14px"
																	:color="isDark ? '#ffffff' : '#000000'" />
															</wd-cell>
					
															<!-- <wd-cell title="创建者" icon="user" custom-class="cellClass">
																<wd-text bold :text="dataItem.username" size="14px"
																	:color="isDark ? '#ffffff' : '#000000'" />
															</wd-cell>
					
															<wd-cell title="创建时间" icon="time" custom-class="cellClass">
																<wd-text bold :text="dataItem.dbtime" size="14px"
																	:color="isDark ? '#ffffff' : '#000000'" />
															</wd-cell> -->
					
															<view style="margin: 10rpx 0;">
																<wd-progress color="#4d80f0" :percentage="dataItem.progess" />
															</view>
														</view>
					
														<wd-gap bg-color="#cccccc" height="2rpx"></wd-gap>
														<!-- <wd-gap bg-color="#cccccc" height="2rpx" v-if="hasPermission('project:Info:update') && (userType === 0 || ((userType === 2 || userType === 3) && (dataItem.status === 0 || dataItem.status === 2)) || (userType === 4 && dataItem.status === -1))"></wd-gap> -->
														<!-- <wd-gap bg-color="#cccccc" height="2rpx" v-if="hasPermission('project:Info:update') && (userType === 0 || userType === 2 || userType === 3) && (dataItem.status === -1 || dataItem.status === 0 || dataItem.status === 2)"></wd-gap> -->
					
														<view style="display: flex; justify-content: flex-end; margin-top: 10rpx; gap: 0 10rpx;">
															<wd-button size="small" type="primary" :loading="loading" @click.stop="handleCanvasToImageChange(dataItem.id)">生成工程调试单</wd-button>
															<wd-button size="small" type="primary" @click.stop="handleJumpChange('/projectPages/projectcontractpage/Index?id=' + dataItem.id)">关联合同</wd-button>
															<wd-button v-if="hasPermission('project:Info:update') && dataItem.status === -1 && (userType === 0 || (userType === 4 && (userId === '1021' || userId === '1023')))" size="small" type="primary" @click.stop="handleCheckPrjChange(dataItem.id, 0)">核准</wd-button>
															<wd-button v-if="hasPermission('project:Info:update') && dataItem.status === 0 && (userType === 0 || userType === 2 || userType === 3)" size="small" type="primary" @click.stop="handleCheckPrjChange(dataItem.id, 1)">启动</wd-button>
															<wd-button v-if="hasPermission('project:Info:update') && dataItem.status === 2 && (userType === 0 || userType === 2)" size="small" type="primary" @click.stop="handleCheckPrjChange(dataItem.id, 3)">审核</wd-button>
														</view>
													</view>
												</view>
											</uni-swipe-action-item>
										</uni-swipe-action>
									</view>
									<view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
										<wd-status-tip image="../static/search.png" tip="暂无项目" />
									</view>
								</view>
					
								<view v-if="activeTab === 1">
									<view v-if="notApprovedList.length > 0">
										<uni-swipe-action>
											<uni-swipe-action-item v-for="(notApproveItem, notApproveIndex) in notApprovedList" :key="notApproveIndex" :right-options="options" @click="handleDeleteProjectChange(notApproveItem.id)">
												<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: notApproveIndex === notApprovedList.length - 1 ? '20rpx 20rpx 40rpx 20rpx' : '20rpx 20rpx 0', borderRadius: '20rpx' }">
													<view style="padding: 20rpx; ">
														<view class="prjInfoHeader">
															<view class="left">
																<wd-text v-if="notApproveItem.ptype === 0" bold :text="notApproveItem.hasOwnProperty('dispatch') && notApproveItem.dispatch ? notApproveItem.proname + ' (' + notApproveItem.dispatch + ')' : notApproveItem.proname" size="15px" :color="isDark ? '#ffffff' : '#000000'" :lines="5" />
																<wd-text v-if="notApproveItem.ptype === 1" bold :text="notApproveItem.hasOwnProperty('dispatch') && notApproveItem.dispatch ? notApproveItem.proname + ' (' + notApproveItem.dispatch + ')' : notApproveItem.proname" size="15px" type="warning" :lines="5" />
																<wd-text v-if="notApproveItem.ptype === 2" bold :text="notApproveItem.hasOwnProperty('dispatch') && notApproveItem.dispatch ? notApproveItem.proname + ' (' + notApproveItem.dispatch + ')' : notApproveItem.proname" size="15px" type="error" :lines="5" />
															</view>
															<view class="right">
																<wd-text bold :text="notApproveItem.status === -1 ? '未核准' : notApproveItem.status === 0 ? '未开始' : notApproveItem.status === 1 ? '进行中' : notApproveItem.status === 2 ? '待审核' : notApproveItem.status === 3 ? '已完成' : '未知'" size="14px" :type="notApproveItem.status === 0 ? 'default' : notApproveItem.status === 1 ? 'primary' : notApproveItem.status === 2 ? 'warning' : notApproveItem.status === 3 ? 'success' : 'default'" />
																<wd-icon v-if="hasPermission('project:Info:update')" name="edit-outline" size="18px" @click.stop="handleJumpChange('/projectPages/addproject/Index?id=' + notApproveItem.id)"></wd-icon>
															</view>
														</view>
					
														<view @click="handleJumpPageChange(notApproveItem.id, notApproveItem.proname)">
															<wd-cell title="周期(天)" icon="calendar" custom-class="cellClass">
																<wd-text bold :text="notApproveItem.period" size="14px"
																	:color="isDark ? '#ffffff' : '#000000'" />
															</wd-cell>
					
															<view v-if="hasPermission('project:DispatchContact:select')" @click.stop="handleJumpChange('/projectPages/diapatcherpage/Index?pid=' + notApproveItem.id)">
																<wd-cell title="调度信息" icon="transfer" custom-class="cellClass">
																	<wd-icon name="view" size="22px"></wd-icon>
																</wd-cell>
															</view>
					
															<wd-cell title="调试类型" icon="list" custom-class="cellClass">
																<wd-tag type="primary" round>
																	{{ notApproveItem.dtype === 0 ? '现场调试' : notApproveItem.dtype === 1 ? '远程调试' : notApproveItem.dtype === 2 ? '无需调试' : '未知' }}
																</wd-tag>
															</wd-cell>
															
															<view @click.stop="handleJumpChange(notApproveItem.debugs > 0 ? '/projectPages/projectdetail/Index?pid=' + notApproveItem.id + '&activeTab=2' : '')">
																<wd-cell title="调试任务数" icon="a-controlplatform" custom-class="cellClass">
																	<wd-text bold :text="notApproveItem.debugs" size="14px" :color="notApproveItem.debugs === 0 ? '#cccccc' : '#000000'" />
																</wd-cell>
															</view>
									
															<view @click.stop="handleJumpChange(notApproveItem.summarys > 0 ? '/projectPages/prjsummarypage/Index?pid=' + notApproveItem.id + '&pname=' + encodeURIComponent(notApproveItem.proname) : '')">
																<wd-cell title="项目总结数" icon="a-controlplatform" custom-class="cellClass">
																	<wd-text bold :text="notApproveItem.summarys" size="14px" :color="notApproveItem.summarys === 0 ? '#cccccc' : '#000000'" />
																</wd-cell>
															</view>
									
															<view @click.stop="handleJumpChange(notApproveItem.dailys > 0 ? '/mePages/technicalsupportdaily/Index?pid=' + notApproveItem.id + '&pname=' + encodeURIComponent(notApproveItem.proname) : '')">
																<wd-cell title="日报数" icon="a-controlplatform" custom-class="cellClass">
																	<wd-text bold :text="notApproveItem.dailys" size="14px" :color="notApproveItem.dailys === 0 ? '#cccccc' : '#000000'" />
																</wd-cell>
															</view>
															
															<wd-cell title="开始时间" icon="time" custom-class="cellClass">
																<wd-text bold :text="notApproveItem.sdbtime || '--'" size="14px"
																	:color="isDark ? '#ffffff' : '#000000'" />
															</wd-cell>
															
															<wd-cell title="商务联系人" icon="user" custom-class="cellClass">
																<wd-text bold :text="notApproveItem.businesscon" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
															</wd-cell>
															
															<wd-cell v-if="notApproveItem.hasOwnProperty('plantime')" title="计划调试时间" icon="time" custom-class="cellClass">
																<wd-text bold :text="notApproveItem.plantime" size="14px"
																	:color="isDark ? '#ffffff' : '#000000'" />
															</wd-cell>
					
															<!-- <wd-cell title="创建者" icon="user" custom-class="cellClass">
																<wd-text bold :text="notApproveItem.username" size="14px"
																	:color="isDark ? '#ffffff' : '#000000'" />
															</wd-cell>
					
															<wd-cell title="创建时间" icon="time" custom-class="cellClass">
																<wd-text bold :text="notApproveItem.dbtime" size="14px"
																	:color="isDark ? '#ffffff' : '#000000'" />
															</wd-cell> -->
					
															<view style="margin: 10rpx 0;">
																<wd-progress color="#4d80f0" :percentage="notApproveItem.progess" />
															</view>
														</view>
					
														<wd-gap bg-color="#cccccc" height="2rpx"></wd-gap>
														<!-- <wd-gap bg-color="#cccccc" height="2rpx" v-if="hasPermission('project:Info:update') && (userType === 0 || ((userType === 2 || userType === 3) && (notApproveItem.status === 0 || notApproveItem.status === 2)) || (userType === 4 && notApproveItem.status === -1))"></wd-gap> -->
					
														<!-- <wd-gap bg-color="#cccccc" height="2rpx" v-if="hasPermission('project:Info:update') && (userType === 0 || ((userType === 2 || userType === 3) && (notApproveItem.status === 0 || notApproveItem.status === 2))) && (notApproveItem.status === -1 || notApproveItem.status === 0 || notApproveItem.status === 2)"></wd-gap> -->
					
														<view style="display: flex; justify-content: flex-end; margin-top: 10rpx; gap: 0 10rpx;">
															<wd-button size="small" type="primary" :loading="loading" @click.stop="handleCanvasToImageChange(notApproveItem.id)">生成工程调试单</wd-button>
															<wd-button size="small" type="primary" @click.stop="handleJumpChange('/projectPages/projectcontractpage/Index?id=' + notApproveItem.id)">关联合同</wd-button>
															<wd-button v-if="hasPermission('project:Info:update') && notApproveItem.status === -1 && (userType === 0 || (userType === 4 && (userId === '1021' || userId === '1023')))" size="small" type="primary" @click.stop="handleCheckPrjChange(notApproveItem.id, 0)">核准</wd-button>
															<wd-button v-if="hasPermission('project:Info:update') && notApproveItem.status === 0 && (userType === 0 || userType === 2 || userType === 3)" size="small" type="primary" @click.stop="handleCheckPrjChange(notApproveItem.id, 1)">启动</wd-button>
															<wd-button v-if="hasPermission('project:Info:update') && notApproveItem.status === 2 && (userType === 0 || userType === 2)" size="small" type="primary" @click.stop="handleCheckPrjChange(notApproveItem.id, 3)">审核</wd-button>
														</view>
													</view>
												</view>
											</uni-swipe-action-item>
										</uni-swipe-action>
									</view>
									<view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
										<wd-status-tip image="../static/search.png" tip="暂无项目" />
									</view>
								</view>
					
								<view v-if="activeTab === 2">
									<view v-if="noStartDataList.length > 0">
										<uni-swipe-action>
											<uni-swipe-action-item v-for="(noStartItem, noStartIndex) in noStartDataList" :key="noStartIndex" :right-options="options" @click="handleDeleteProjectChange(noStartItem.id)">
												<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: noStartIndex === noStartDataList.length - 1 ? '20rpx 20rpx 40rpx 20rpx' : '20rpx 20rpx 0', borderRadius: '20rpx' }">
													<view style="padding: 20rpx; ">
														<view class="prjInfoHeader">
															<view class="left">
																<wd-text v-if="noStartItem.ptype === 0" bold :text="noStartItem.hasOwnProperty('dispatch') && noStartItem.dispatch ? noStartItem.proname + ' (' + noStartItem.dispatch + ')' : noStartItem.proname" size="15px" :color="isDark ? '#ffffff' : '#000000'" :lines="5" />
																<wd-text v-if="noStartItem.ptype === 1" bold :text="noStartItem.hasOwnProperty('dispatch') && noStartItem.dispatch ? noStartItem.proname + ' (' + noStartItem.dispatch + ')' : noStartItem.proname" size="15px" type="warning" :lines="5" />
																<wd-text v-if="noStartItem.ptype === 2" bold :text="noStartItem.hasOwnProperty('dispatch') && noStartItem.dispatch ? noStartItem.proname + ' (' + noStartItem.dispatch + ')' : noStartItem.proname" size="15px" type="error" :lines="5" />
															</view>
															<view class="right">
																<wd-text bold :text="noStartItem.status === 0 ? '未开始' : noStartItem.status === 1 ? '进行中' : noStartItem.status === 2 ? '待审核' : noStartItem.status === 3 ? '已完成' : '未知'" size="14px" :type="noStartItem.status === 0 ? 'default' : noStartItem.status === 1 ? 'primary' : noStartItem.status === 2 ? 'warning' : noStartItem.status === 3 ? 'success' : 'default'" />
																<wd-icon v-if="hasPermission('project:Info:update')" name="edit-outline" size="18px" @click.stop="handleJumpChange('/projectPages/addproject/Index?id=' + noStartItem.id)"></wd-icon>
															</view>
														</view>
					
														<view @click="handleJumpPageChange(noStartItem.id, noStartItem.proname)">
															<wd-cell title="周期(天)" icon="calendar" custom-class="cellClass">
																<wd-text bold :text="noStartItem.period" size="14px"
																	:color="isDark ? '#ffffff' : '#000000'" />
															</wd-cell>
					
															<view v-if="hasPermission('project:DispatchContact:select')" @click.stop="handleJumpChange('/projectPages/diapatcherpage/Index?pid=' + noStartItem.id)">
																<wd-cell title="调度信息" icon="transfer" custom-class="cellClass">
																	<wd-icon name="view" size="22px"></wd-icon>
																</wd-cell>
															</view>
					
															<wd-cell title="调试类型" icon="list" custom-class="cellClass">
																<wd-tag type="primary" round>
																	{{ noStartItem.dtype === 0 ? '现场调试' : noStartItem.dtype === 1 ? '远程调试' : noStartItem.dtype === 2 ? '无需调试' : '未知' }}
																</wd-tag>
															</wd-cell>
															
															<view @click.stop="handleJumpChange(noStartItem.debugs > 0 ? '/projectPages/projectdetail/Index?pid=' + noStartItem.id + '&activeTab=2' : '')">
																<wd-cell title="调试任务数" icon="a-controlplatform" custom-class="cellClass">
																	<wd-text bold :text="noStartItem.debugs" size="14px" :color="noStartItem.debugs === 0 ? '#cccccc' : '#000000'" />
																</wd-cell>
															</view>
									
															<view @click.stop="handleJumpChange(noStartItem.summarys > 0 ? '/projectPages/prjsummarypage/Index?pid=' + noStartItem.id + '&pname=' + encodeURIComponent(noStartItem.proname) : '')">
																<wd-cell title="项目总结数" icon="a-controlplatform" custom-class="cellClass">
																	<wd-text bold :text="noStartItem.summarys" size="14px" :color="noStartItem.summarys === 0 ? '#cccccc' : '#000000'" />
																</wd-cell>
															</view>
									
															<view @click.stop="handleJumpChange(noStartItem.dailys > 0 ? '/mePages/technicalsupportdaily/Index?pid=' + noStartItem.id + '&pname=' + encodeURIComponent(noStartItem.proname) : '')">
																<wd-cell title="日报数" icon="a-controlplatform" custom-class="cellClass">
																	<wd-text bold :text="noStartItem.dailys" size="14px" :color="noStartItem.dailys === 0 ? '#cccccc' : '#000000'" />
																</wd-cell>
															</view>
															
															<wd-cell title="开始时间" icon="time" custom-class="cellClass">
																<wd-text bold :text="noStartItem.sdbtime || '--'" size="14px"
																	:color="isDark ? '#ffffff' : '#000000'" />
															</wd-cell>
															
															<wd-cell title="商务联系人" icon="user" custom-class="cellClass">
																<wd-text bold :text="noStartItem.businesscon" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
															</wd-cell>
															
															<wd-cell v-if="noStartItem.hasOwnProperty('plantime')" title="计划调试时间" icon="time" custom-class="cellClass">
																<wd-text bold :text="noStartItem.plantime" size="14px"
																	:color="isDark ? '#ffffff' : '#000000'" />
															</wd-cell>
					
															<!-- <wd-cell title="创建者" icon="user" custom-class="cellClass">
																<wd-text bold :text="noStartItem.username" size="14px"
																	:color="isDark ? '#ffffff' : '#000000'" />
															</wd-cell>
					
															<wd-cell title="创建时间" icon="time" custom-class="cellClass">
																<wd-text bold :text="noStartItem.dbtime" size="14px"
																	:color="isDark ? '#ffffff' : '#000000'" />
															</wd-cell> -->
					
															<view style="margin: 10rpx 0;">
																<wd-progress color="#4d80f0" :percentage="noStartItem.progess" />
															</view>
														</view>
					
														<wd-gap bg-color="#cccccc" height="2rpx"></wd-gap>
														<!-- <wd-gap bg-color="#cccccc" height="2rpx" v-if="hasPermission('project:Info:update') && (userType === 0 || userType === 2 || userType === 3) && noStartItem.status === 0"></wd-gap> -->
					
														<view style="display: flex; justify-content: flex-end; margin-top: 10rpx; gap: 0 10rpx;">
															<wd-button size="small" type="primary" :loading="loading" @click.stop="handleCanvasToImageChange(noStartItem.id)">生成工程调试单</wd-button>
															<wd-button size="small" type="primary" @click.stop="handleJumpChange('/projectPages/projectcontractpage/Index?id=' + noStartItem.id)">关联合同</wd-button>
															<wd-button v-if="hasPermission('project:Info:update') && (userType === 0 || userType === 2 || userType === 3) && noStartItem.status === 0" size="small" type="primary" @click.stop="handleCheckPrjChange(noStartItem.id, 1)">启动</wd-button>
														</view>
													</view>
												</view>
											</uni-swipe-action-item>
										</uni-swipe-action>
									</view>
									<view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
										<wd-status-tip image="../static/search.png" tip="暂无项目" />
									</view>
								</view>
					
								<view v-if="activeTab === 3">
									<view v-if="progressingDataList.length > 0">
										<uni-swipe-action>
											<uni-swipe-action-item v-for="(progressingItem, progressingIndex) in progressingDataList" :key="progressingIndex" :right-options="options" @click="handleDeleteProjectChange(progressingItem.id)">
												<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: progressingIndex === progressingDataList.length - 1 ? '20rpx 20rpx 40rpx 20rpx' : '20rpx 20rpx 0', borderRadius: '20rpx' }">
													<view style="padding: 20rpx; ">
														<view class="prjInfoHeader">
															<view class="left">
																<wd-text v-if="progressingItem.ptype === 0" bold :text="progressingItem.hasOwnProperty('dispatch') && progressingItem.dispatch ? progressingItem.proname + ' (' + progressingItem.dispatch + ')' : progressingItem.proname" size="15px" :color="isDark ? '#ffffff' : '#000000'" :lines="5" />
																<wd-text v-if="progressingItem.ptype === 1" bold :text="progressingItem.hasOwnProperty('dispatch') && progressingItem.dispatch ? progressingItem.proname + ' (' + progressingItem.dispatch + ')' : progressingItem.proname" size="15px" type="warning" :lines="5" />
																<wd-text v-if="progressingItem.ptype === 2" bold :text="progressingItem.hasOwnProperty('dispatch') && progressingItem.dispatch ? progressingItem.proname + ' (' + progressingItem.dispatch + ')' : progressingItem.proname" size="15px" type="error" :lines="5" />
															</view>
															<view class="right">
																<wd-text bold :text="progressingItem.status === 0 ? '未开始' : progressingItem.status === 1 ? '进行中' : progressingItem.status === 2 ? '待审核' : progressingItem.status === 3 ? '已完成' : '未知'" size="14px" :type="progressingItem.status === 0 ? 'default' : progressingItem.status === 1 ? 'primary' : progressingItem.status === 2 ? 'warning' : progressingItem.status === 3 ? 'success' : 'default'" />
																<wd-icon v-if="hasPermission('project:Info:update')" name="edit-outline" size="18px" @click.stop="handleJumpChange('/projectPages/addproject/Index?id=' + progressingItem.id)"></wd-icon>
															</view>
														</view>
					
														<view @click="handleJumpPageChange(progressingItem.id, progressingItem.proname)">
															<wd-cell title="周期(天)" icon="calendar" custom-class="cellClass">
																<wd-text bold :text="progressingItem.period" size="14px"
																	:color="isDark ? '#ffffff' : '#000000'" />
															</wd-cell>
					
															<view v-if="hasPermission('project:DispatchContact:select')" @click.stop="handleJumpChange('/projectPages/diapatcherpage/Index?pid=' + progressingItem.id)">
																<wd-cell title="调度信息" icon="transfer" custom-class="cellClass">
																	<wd-icon name="view" size="22px"></wd-icon>
																</wd-cell>
															</view>
					
															<wd-cell title="调试类型" icon="list" custom-class="cellClass">
																<wd-tag type="primary" round>
																	{{ progressingItem.dtype === 0 ? '现场调试' : progressingItem.dtype === 1 ? '远程调试' : progressingItem.dtype === 2 ? '无需调试' : '未知' }}
																</wd-tag>
															</wd-cell>
															
															<view @click.stop="handleJumpChange(progressingItem.debugs > 0 ? '/projectPages/projectdetail/Index?pid=' + progressingItem.id + '&activeTab=2' : '')">
																<wd-cell title="调试任务数" icon="a-controlplatform" custom-class="cellClass">
																	<wd-text bold :text="progressingItem.debugs" size="14px" :color="progressingItem.debugs === 0 ? '#cccccc' : '#000000'" />
																</wd-cell>
															</view>
									
															<view @click.stop="handleJumpChange(progressingItem.summarys > 0 ? '/projectPages/prjsummarypage/Index?pid=' + progressingItem.id + '&pname=' + encodeURIComponent(progressingItem.proname) : '')">
																<wd-cell title="项目总结数" icon="a-controlplatform" custom-class="cellClass">
																	<wd-text bold :text="progressingItem.summarys" size="14px" :color="progressingItem.summarys === 0 ? '#cccccc' : '#000000'" />
																</wd-cell>
															</view>
									
															<view @click.stop="handleJumpChange(progressingItem.dailys > 0 ? '/mePages/technicalsupportdaily/Index?pid=' + progressingItem.id + '&pname=' + encodeURIComponent(progressingItem.proname) : '')">
																<wd-cell title="日报数" icon="a-controlplatform" custom-class="cellClass">
																	<wd-text bold :text="progressingItem.dailys" size="14px" :color="progressingItem.dailys === 0 ? '#cccccc' : '#000000'" />
																</wd-cell>
															</view>
															
															<wd-cell title="开始时间" icon="time" custom-class="cellClass">
																<wd-text bold :text="progressingItem.sdbtime || '--'" size="14px"
																	:color="isDark ? '#ffffff' : '#000000'" />
															</wd-cell>
															
															<wd-cell title="商务联系人" icon="user" custom-class="cellClass">
																<wd-text bold :text="progressingItem.businesscon" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
															</wd-cell>
															
															<wd-cell v-if="progressingItem.hasOwnProperty('plantime')" title="计划调试时间" icon="time" custom-class="cellClass">
																<wd-text bold :text="progressingItem.plantime" size="14px"
																	:color="isDark ? '#ffffff' : '#000000'" />
															</wd-cell>
					
															<!-- <wd-cell title="创建者" icon="user" custom-class="cellClass">
																<wd-text bold :text="progressingItem.username" size="14px"
																	:color="isDark ? '#ffffff' : '#000000'" />
															</wd-cell>
					
															<wd-cell title="创建时间" icon="time" custom-class="cellClass">
																<wd-text bold :text="progressingItem.dbtime" size="14px"
																	:color="isDark ? '#ffffff' : '#000000'" />
															</wd-cell> -->
					
															<view style="margin: 10rpx 0;">
																<wd-progress color="#4d80f0" :percentage="progressingItem.progess" />
															</view>
															
															<wd-gap bg-color="#cccccc" height="2rpx"></wd-gap>
															
															<view style="display: flex; justify-content: flex-end; margin-top: 10rpx; gap: 0 10rpx;">
																<wd-button size="small" type="primary" :loading="loading" @click.stop="handleCanvasToImageChange(progressingItem.id)">生成工程调试单</wd-button>
																<wd-button size="small" type="primary" @click.stop="handleJumpChange('/projectPages/projectcontractpage/Index?id=' + progressingItem.id)">关联合同</wd-button>
															</view>
														</view>
													</view>
												</view>
											</uni-swipe-action-item>
										</uni-swipe-action>
									</view>
									<view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
										<wd-status-tip image="../static/search.png" tip="暂无项目" />
									</view>
								</view>
					
								<view v-if="activeTab === 4">
									<view v-if="auditDataList.length > 0">
										<uni-swipe-action>
											<uni-swipe-action-item v-for="(auditItem, auditIndex) in auditDataList" :key="auditIndex" :right-options="options" @click="handleDeleteProjectChange(auditItem.id)">
												<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: auditIndex === auditDataList.length - 1 ? '20rpx 20rpx 40rpx 20rpx' : '20rpx 20rpx 0', borderRadius: '20rpx' }">
													<view style="padding: 20rpx; ">
														<view class="prjInfoHeader">
															<view class="left">
																<wd-text v-if="auditItem.ptype === 0" bold :text="auditItem.hasOwnProperty('dispatch') && auditItem.dispatch ? auditItem.proname + ' (' + auditItem.dispatch + ')' : auditItem.proname" size="15px" :color="isDark ? '#ffffff' : '#000000'" :lines="5" />
																<wd-text v-if="auditItem.ptype === 1" bold :text="auditItem.hasOwnProperty('dispatch') && auditItem.dispatch ? auditItem.proname + ' (' + auditItem.dispatch + ')' : auditItem.proname" size="15px" type="warning" :lines="5" />
																<wd-text v-if="auditItem.ptype === 2" bold :text="auditItem.hasOwnProperty('dispatch') && auditItem.dispatch ? auditItem.proname + ' (' + auditItem.dispatch + ')' : auditItem.proname" size="15px" type="error" :lines="5" />
															</view>
															<view class="right">
																<wd-text bold :text="auditItem.status === 0 ? '未开始' : auditItem.status === 1 ? '进行中' : auditItem.status === 2 ? '待审核' : auditItem.status === 3 ? '已完成' : '未知'" size="14px" :type="auditItem.status === 0 ? 'default' : auditItem.status === 1 ? 'primary' : auditItem.status === 2 ? 'warning' : auditItem.status === 3 ? 'success' : 'default'" />
																<wd-icon v-if="hasPermission('project:Info:update')" name="edit-outline" size="18px" @click.stop="handleJumpChange('/projectPages/addproject/Index?id=' + auditItem.id)"></wd-icon>
															</view>
														</view>
					
														<view @click="handleJumpPageChange(auditItem.id, auditItem.proname)">
															<wd-cell title="周期(天)" icon="calendar" custom-class="cellClass">
																<wd-text bold :text="auditItem.period" size="14px"
																	:color="isDark ? '#ffffff' : '#000000'" />
															</wd-cell>
					
															<view v-if="hasPermission('project:DispatchContact:select')" @click.stop="handleJumpChange('/projectPages/diapatcherpage/Index?pid=' + auditItem.id)">
																<wd-cell title="调度信息" icon="transfer" custom-class="cellClass">
																	<wd-icon name="view" size="22px"></wd-icon>
																</wd-cell>
															</view>
					
															<wd-cell title="调试类型" icon="list" custom-class="cellClass">
																<wd-tag type="primary" round>
																	{{ auditItem.dtype === 0 ? '现场调试' : auditItem.dtype === 1 ? '远程调试' : auditItem.dtype === 2 ? '无需调试' : '未知' }}
																</wd-tag>
															</wd-cell>
															
															<view @click.stop="handleJumpChange(auditItem.debugs > 0 ? '/projectPages/projectdetail/Index?pid=' + auditItem.id + '&activeTab=2' : '')">
																<wd-cell title="调试任务数" icon="a-controlplatform" custom-class="cellClass">
																	<wd-text bold :text="auditItem.debugs" size="14px" :color="auditItem.debugs === 0 ? '#cccccc' : '#000000'" />
																</wd-cell>
															</view>
									
															<view @click.stop="handleJumpChange(auditItem.summarys > 0 ? '/projectPages/prjsummarypage/Index?pid=' + auditItem.id + '&pname=' + encodeURIComponent(auditItem.proname) : '')">
																<wd-cell title="项目总结数" icon="a-controlplatform" custom-class="cellClass">
																	<wd-text bold :text="auditItem.summarys" size="14px" :color="auditItem.summarys === 0 ? '#cccccc' : '#000000'" />
																</wd-cell>
															</view>
									
															<view @click.stop="handleJumpChange(auditItem.dailys > 0 ? '/mePages/technicalsupportdaily/Index?pid=' + auditItem.id + '&pname=' + encodeURIComponent(auditItem.proname) : '')">
																<wd-cell title="日报数" icon="a-controlplatform" custom-class="cellClass">
																	<wd-text bold :text="auditItem.dailys" size="14px" :color="auditItem.dailys === 0 ? '#cccccc' : '#000000'" />
																</wd-cell>
															</view>
															
															<wd-cell title="开始时间" icon="time" custom-class="cellClass">
																<wd-text bold :text="auditItem.sdbtime || '--'" size="14px"
																	:color="isDark ? '#ffffff' : '#000000'" />
															</wd-cell>
															
															<wd-cell title="商务联系人" icon="user" custom-class="cellClass">
																<wd-text bold :text="auditItem.businesscon" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
															</wd-cell>
															
															<wd-cell v-if="auditItem.hasOwnProperty('plantime')" title="计划调试时间" icon="time" custom-class="cellClass">
																<wd-text bold :text="auditItem.plantime" size="14px"
																	:color="isDark ? '#ffffff' : '#000000'" />
															</wd-cell>
					
															<!-- <wd-cell title="创建者" icon="user" custom-class="cellClass">
																<wd-text bold :text="auditItem.username" size="14px"
																	:color="isDark ? '#ffffff' : '#000000'" />
															</wd-cell>
					
															<wd-cell title="创建时间" icon="time" custom-class="cellClass">
																<wd-text bold :text="auditItem.dbtime" size="14px"
																	:color="isDark ? '#ffffff' : '#000000'" />
															</wd-cell> -->
					
															<view style="margin: 10rpx 0;">
																<wd-progress color="#4d80f0" :percentage="auditItem.progess" />
															</view>
														</view>
					
														<wd-gap bg-color="#cccccc" height="2rpx"></wd-gap>
														<!-- <wd-gap bg-color="#cccccc" height="2rpx" v-if="hasPermission('project:Info:update') && (userType === 0 || userType === 2) && auditItem.status === 2"></wd-gap> -->
					
														<view style="display: flex; justify-content: flex-end; margin-top: 10rpx; gap: 0 10rpx;">
															<wd-button size="small" type="primary" :loading="loading" @click.stop="handleCanvasToImageChange(auditItem.id)">生成工程调试单</wd-button>
															<wd-button size="small" type="primary" @click.stop="handleJumpChange('/projectPages/projectcontractpage/Index?id=' + auditItem.id)">关联合同</wd-button>
															<wd-button v-if="hasPermission('project:Info:update') && (userType === 0 || userType === 2) && auditItem.status === 2" size="small" type="primary" @click.stop="handleCheckPrjChange(auditItem.id, 3)">审核</wd-button>
														</view>
													</view>
												</view>
											</uni-swipe-action-item>
										</uni-swipe-action>
									</view>
									<view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
										<wd-status-tip image="../static/search.png" tip="暂无项目" />
									</view>
								</view>
					
								<view v-if="activeTab === 5">
									<view v-if="completeDataList.length > 0">
										<uni-swipe-action>
											<uni-swipe-action-item v-for="(completeItem, completeIndex) in completeDataList" :key="completeIndex" :right-options="options" @click="handleDeleteProjectChange(completeItem.id)">
												<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: completeIndex === completeDataList.length - 1 ? '20rpx 20rpx 40rpx 20rpx' : '20rpx', borderRadius: '20rpx' }">
													<view style="padding: 20rpx; ">
														<view class="prjInfoHeader">
															<view class="left">
																<wd-text v-if="completeItem.ptype === 0" bold :text="completeItem.hasOwnProperty('dispatch') && completeItem.dispatch ? completeItem.proname + ' (' + completeItem.dispatch + ')' : completeItem.proname" size="15px" :color="isDark ? '#ffffff' : '#000000'" :lines="5" />
																<wd-text v-if="completeItem.ptype === 1" bold :text="completeItem.hasOwnProperty('dispatch') && completeItem.dispatch ? completeItem.proname + ' (' + completeItem.dispatch + ')' : completeItem.proname" size="15px" type="warning" :lines="5" />
																<wd-text v-if="completeItem.ptype === 2" bold :text="completeItem.hasOwnProperty('dispatch') && completeItem.dispatch ? completeItem.proname + ' (' + completeItem.dispatch + ')' : completeItem.proname" size="15px" type="error" :lines="5" />
															</view>
															<view class="right">
																<wd-text bold :text="completeItem.status === 0 ? '未开始' : completeItem.status === 1 ? '进行中' : completeItem.status === 2 ? '待审核' : completeItem.status === 3 ? '已完成' : '未知'" size="14px" :type="completeItem.status === 0 ? 'default' : completeItem.status === 1 ? 'primary' : completeItem.status === 2 ? 'warning' : completeItem.status === 3 ? 'success' : 'default'" />
																<wd-icon v-if="hasPermission('project:Info:update')" name="edit-outline" size="18px" @click.stop="handleJumpChange('/projectPages/addproject/Index?id=' + completeItem.id)"></wd-icon>
															</view>
														</view>
					
														<view  @click="handleJumpPageChange(completeItem.id, completeItem.proname)">
															<wd-cell title="周期(天)" icon="calendar" custom-class="cellClass">
																<wd-text bold :text="completeItem.period" size="14px"
																	:color="isDark ? '#ffffff' : '#000000'" />
															</wd-cell>
					
															<view v-if="hasPermission('project:DispatchContact:select')" @click.stop="handleJumpChange('/projectPages/diapatcherpage/Index?pid=' + completeItem.id)">
																<wd-cell title="调度信息" icon="transfer" custom-class="cellClass">
																	<wd-icon name="view" size="22px"></wd-icon>
																</wd-cell>
															</view>
					
															<wd-cell title="调试类型" icon="list" custom-class="cellClass">
																<wd-tag type="primary" round>
																	{{ completeItem.dtype === 0 ? '现场调试' : completeItem.dtype === 1 ? '远程调试' : completeItem.dtype === 2 ? '无需调试' : '未知' }}
																</wd-tag>
															</wd-cell>
															
															<view @click.stop="handleJumpChange(completeItem.debugs > 0 ? '/projectPages/projectdetail/Index?pid=' + completeItem.id + '&activeTab=2' : '')">
																<wd-cell title="调试任务数" icon="a-controlplatform" custom-class="cellClass">
																	<wd-text bold :text="completeItem.debugs" size="14px" :color="completeItem.debugs === 0 ? '#cccccc' : '#000000'" />
																</wd-cell>
															</view>
									
															<view @click.stop="handleJumpChange(completeItem.summarys > 0 ? '/projectPages/prjsummarypage/Index?pid=' + completeItem.id + '&pname=' + encodeURIComponent(completeItem.proname) : '')">
																<wd-cell title="项目总结数" icon="a-controlplatform" custom-class="cellClass">
																	<wd-text bold :text="completeItem.summarys" size="14px" :color="completeItem.summarys === 0 ? '#cccccc' : '#000000'" />
																</wd-cell>
															</view>
									
															<view @click.stop="handleJumpChange(completeItem.dailys > 0 ? '/mePages/technicalsupportdaily/Index?pid=' + completeItem.id + '&pname=' + encodeURIComponent(completeItem.proname) : '')">
																<wd-cell title="日报数" icon="a-controlplatform" custom-class="cellClass">
																	<wd-text bold :text="completeItem.dailys" size="14px" :color="completeItem.dailys === 0 ? '#cccccc' : '#000000'" />
																</wd-cell>
															</view>
									
															<wd-cell title="开始时间" icon="time" custom-class="cellClass">
																<wd-text bold :text="completeItem.sdbtime || '--'" size="14px"
																	:color="isDark ? '#ffffff' : '#000000'" />
															</wd-cell>
					
															<wd-cell v-if="completeItem.status === 3 && completeItem.ckusername" title="验收人" icon="user" custom-class="cellClass">
																<wd-text bold :text="completeItem.ckusername" size="14px"
																	:color="isDark ? '#ffffff' : '#000000'" />
															</wd-cell>
					
															<wd-cell v-if="completeItem.status === 3 && completeItem.ckdbtime" title="验收时间" icon="time" custom-class="cellClass">
																<wd-text bold :text="completeItem.ckdbtime" size="14px"
																	:color="isDark ? '#ffffff' : '#000000'" />
															</wd-cell>
															
															<wd-cell title="商务联系人" icon="user" custom-class="cellClass">
																<wd-text bold :text="completeItem.businesscon" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
															</wd-cell>
															
															<wd-cell v-if="completeItem.hasOwnProperty('plantime')" title="计划调试时间" icon="time" custom-class="cellClass">
																<wd-text bold :text="completeItem.plantime" size="14px"
																	:color="isDark ? '#ffffff' : '#000000'" />
															</wd-cell>
					
															<!-- <wd-cell title="创建者" icon="user" custom-class="cellClass">
																<wd-text bold :text="completeItem.username" size="14px"
																	:color="isDark ? '#ffffff' : '#000000'" />
															</wd-cell>
					
															<wd-cell title="创建时间" icon="time" custom-class="cellClass">
																<wd-text bold :text="completeItem.dbtime" size="14px"
																	:color="isDark ? '#ffffff' : '#000000'" />
															</wd-cell> -->
					
															<view style="margin: 10rpx 0;">
																<wd-progress color="#4d80f0" :percentage="completeItem.progess" />
															</view>
															
															<wd-gap bg-color="#cccccc" height="2rpx"></wd-gap>
															
															<view style="display: flex; justify-content: flex-end; margin-top: 10rpx; gap: 0 10rpx;">
																<wd-button size="small" type="primary" :loading="loading" @click.stop="handleCanvasToImageChange(completeItem.id)">生成工程调试单</wd-button>
																<wd-button size="small" type="primary" @click.stop="handleJumpChange('/projectPages/projectcontractpage/Index?id=' + completeItem.id)">关联合同</wd-button>
															</view>
														</view>
													</view>
												</view>
											</uni-swipe-action-item>
										</uni-swipe-action>
									</view>
									<view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
										<wd-status-tip image="../static/search.png" tip="暂无项目" />
									</view>
								</view>
							</scroll-view>
						</wd-tab>
					</wd-tabs>		
				</view>
			</view>

			<wd-fab draggable v-if="hasPermission('project:Info:insert')" position="right-bottom" :gap="{ bottom: 70 }" :expandable="false" @click="handleAddProjectChange"></wd-fab>

			<wd-backtop :bottom="hasPermission('project:Info:insert') ? 135 : 70" :scrollTop="fixedScrollTop" :zIndex="99" customStyle="background: #007aff; color:white; position: fixed;" @click="handleGotoTopChange"></wd-backtop>
		
			<wd-tabbar shape="round" model-value="project" placeholder bordered safe-area-inset-bottom fixed @change="handleTabbarChange">
				<wd-tabbar-item v-for="(item, index) in tabbarList" :key="index" :name="item.name" :value="getTabbarItemValue(item.name)" :title="item.title" :icon="item.icon" />
			</wd-tabbar>
			
			<wd-message-box />
			
			<canvas canvas-id="reportCanvas" id="reportCanvas" :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px', position: 'absolute', left: '-9999px' }" />
		</view>
		
		<wd-popup closable :custom-style="`width: 90vw; margin-top: ${topFixedHeight}px;`" :z-index="99" v-model="userShow" position="left" @close="handleCloseUserShowChange">
		    <wd-gap height="70rpx" />
		
		    <wd-search v-model="dataForm.participantFuzzy" placeholder="请输入" placeholder-left cancel-txt="搜索" @search="handleSearchChange" @cancel="handleSearchUserChange" @clear="handleClearUserChange" />
		
			<scroll-view scroll-y refresher-enabled	:refresher-triggered="userTriggered" @refresherrefresh="handleScrollUserRefreshChange" @scrolltolower="handleScrolltolowerUserChange" style="height: calc(100vh - 260rpx);">
				<wd-radio-group v-model="dataForm.participant" shape="dot" @change="handleRadioSelectChange">
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
.wrapper {
    width: 100%;
    height: 100vh;
    overflow: hidden;
}

.topFixedWrap {
    position: fixed;
    left: 0;
    width: 100%;
    z-index: 99;
    background-color: #F5F5F5;
    box-sizing: border-box;
}

:deep(.wd-tabs__container) {
    background: #F5F5F5 !important;
}

.prjInfoHeader {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin: 10rpx 0 !important;
    margin-bottom: 20rpx;

    .left {
        display: flex;
        word-break: break-all;
        align-items: center;
        margin-left: 10rpx;
        width: calc(100vw - 250rpx);
    }

    .right {
        display: flex;
        flex-direction: row;
        justify-content: flex-end;
        align-items: center;
        gap: 0 10rpx;
    }
}

:deep(.cellClass) {
    padding: 0 !important;

    .wd-cell__wrapper {
        padding: 10rpx !important;
    }
}

:deep(.wd-progress__outer) {
    height: 7px !important;
    border-radius: 10px !important;
}

:deep(.wd-progress__inner) {
    border-radius: 10px !important;
}

:deep(.uni-swipe_button) {
    margin-top: 20rpx !important;
}

.filterButton {
	width: 50%;
}

.wot-theme-dark {
	:deep(.wd-tab__body) {
		background: #000000 !important;
	}
	
	:deep(.uni-scroll-view) {
		background: #000000 !important;
	}
}
</style>