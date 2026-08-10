<script setup lang="ts">
import { throttle } from '@/utils/debounce';
import { useLargeArrayStore } from '@/store/useDataStore';
import { reactive, ref, onMounted, computed, nextTick, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useMessage } from 'wot-design-uni';
import { globalData } from '@/utils/global';
import { getSystemDate, hasPermission, wgs84ToGcj02 } from '@/utils/index';
import { useTabbar } from '@/composables/useTabbar';
import { onReady, onLoad, onShow, onUnload, onPageScroll, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
import { useTheme } from '@/composables/theme/theme';
import { fetchGetAllUserDataList, fetchGetSystemHomePageInfo, fetchGetPrjDataList, fetchDeletePrjInfo, fetchUpdatePrjInfo, fetchGetPrjHomePageInfo, fetchSavePrjClockinInfo, fetchGetProvinceInfo, fetchGetCityInfo, fetchGetPrjInfo, fetchGetPrjMemberDataList, fetchGetDebugEquipmentDataList, fetchGetDebugBusinessDataList, fetchGetDebugBusinessDataListByPrjId, fetchGetContractsDevicesPageByPrjId } from '@/service/index';
import Reward from '@/components/reward.vue';
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

const store = useLargeArrayStore();

const clickLock = ref<boolean>(false);

const isDark = computed(() => theme.value === 'dark');

const topFixedHeight = ref<number>(0);
const scrollViewHeight = ref<number>(0);
const topFixedWrap = ref<any>(null);

const recentDataList = ref<any[]>([]);
const dataList = ref<any[]>([]);
const notApprovedList = ref<any[]>([]);
const noStartDataList = ref<any[]>([]);
const progressingDataList = ref<any[]>([]);
const auditDataList = ref<any[]>([]);
const completeDataList = ref<any[]>([]);
const scrollTop = ref<number>(0);
const scrollFixedTop = ref<number>(0);
const activePrjTab = ref<number>(0);
const activeTab = ref<number>(0);
const userId = ref<string>(uni.getStorageSync('userId'));
const userType = ref<number>(uni.getStorageSync('usertype'));
const ptype = ref<number>(-1);
const debugType = ref<number>(-1);
const rangeTime = ref<any[]>([]);
const dropMenuRef = ref();
const loading = ref<boolean>(false);

// 初始化每个页面的scrollTop
const scrollTopPrjList = ref<any[]>([0, 0]);
const scrollTopStorePrjList = ref<any[]>([0, 0]);

// 排名数据
const rankModal = ref()
const topList = ref([])
const topListUsers = ref([])
const userIdNameObj = ref<any>({});
const propDate = ref<string>('');

const canInsert = ref<boolean>(hasPermission('project:Info:insert'));
const canUpdate = ref<boolean>(hasPermission('project:Info:update'));
const canDelete = ref<boolean>(hasPermission('project:Info:delete'));

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

const tabsList = ref<{ title: string, value: number }[]>([
    {
        title: '全部',
        value: -100
    },
    {
        title: '未核准',
        value: -1
    },
    {
        title: '未开始',
        value: 0
    },
    {
        title: '进行中',
        value: 1
    },
    {
        title: '待审核',
        value: 2
    },
    {
        title: '已完成',
        value: 3
    }
]);

const options = ref<any>(canDelete.value ? [
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
    limit: 10,
    total: 0,
    state: 'loading',
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
	try {
		loading.value = true;
		let outInventoryIdStatusObj: any = {};
		const data = await fetchGetPrjInfo(id);
		const data1 = await fetchGetPrjMemberDataList({ page: 1, limit: 100, pid: id });
		const data2 = await fetchGetDebugEquipmentDataList({ page: 1, limit: 100, pid: id });
		// const data3 = await fetchGetDebugBusinessDataList({ page: 1, limit: 100, pid: id });
		const data3 = await fetchGetDebugBusinessDataListByPrjId({ page: 1, limit: 100, pid: id });
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
				devstatus: data2Item.devstatus === 0 ? '正常' : data2Item.devstatus === 1 ? '异常' : '未知',
				outInventoryStatus: outInventoryIdStatusObj[String(data2Item.id)] || '未知'
			}
		});
		const ctx = uni.createCanvasContext('reportCanvas');
		ctx.setFontSize(fontSize);
		
		// 等 canvas resize 完成再画
		setTimeout(drawReport, 50);
	} catch {
		loading.value = false;
	}
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
				// #ifdef APP || APP-PLUS
				scrollViewHeight.value = sysInfo.windowHeight - topFixedHeight.value - 115 - 44;
				// #endif
				
				// #ifdef H5
				scrollViewHeight.value = sysInfo.windowHeight - topFixedHeight.value - 115;
				// #endif
            }
        })
        .exec();
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
	dataForm.page = 1;
    getDataList();
}

// 搜索
function handleSearchChange() {
	scrollTop.value = scrollFixedTop.value;
	nextTick(() => {
		scrollTop.value = 0;
		dataForm.page = 1;
		getDataList();
	})
}

// 切换近期项目、项目列表
const handleTabsPrjChange = ({ index }: { index: number }) => {
	activePrjTab.value = index;
	scrollTopPrjList.value[index] = scrollTopStorePrjList.value[index];
	if (index === 0) {
		if (recentDataList.value.length === 0) {
		    getDataList();
		}
	} else {
		if (dataList.value.length === 0) {
			dataForm.page = 1;
			getDataList();
		}
	}
}

// 获取项目列表信息
const getDataList = throttle(async () => {
	let permissionList = globalData.permissionList.length > 0 ? globalData.permissionList : uni.getStorageSync('permissionList') || [];
	if (permissionList.length === 0) {
		return
	}
    if (!hasPermission('project:Info:select')) {
        uni.showToast({
            icon: 'none',
            title: '暂无项目查询权限, 请联系管理员',
            duration: 1500
        })
        return
    }
	if (userType.value === 1) {
		activePrjTab.value = 1;
	}
    try {
		if (activePrjTab.value === 0) {
			if (dataForm.recentPage === 1) {
				scrollTopStorePrjList.value[activePrjTab.value] = 0;
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
			if (dataForm.page === 1) {
			    dataList.value = [];
			}
			let queryParams: any = activeTab.value === 0 ? {
				page: dataForm.page,
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
				page: dataForm.page,
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
			dataList.value = dataList.value.concat(data.list);
			dataForm.total = Number(data.total);
			if (dataList.value.length < dataForm.total) {
				dataForm.state = 'loadmore';
			} else {
				dataForm.state = 'finished';
			}
		}
    } catch (err) {
        console.error('获取项目列表失败', err);
    }
}, 200, { leading: true, trailing: true })

// 项目详情
function handleJumpPageChange(id: number, proname: string) {
	if (clickLock.value) return;
	clickLock.value = true;
    uni.navigateTo({
        // url: `/projectPages/contractpage/Index?id=${id}`,
        url: `/projectPages/projectdetail/Index?pid=${id}&proname=${encodeURIComponent(proname)}`,
		complete: () => {
			clickLock.value = false;
		}
    });
}

// 添加项目
const handleAddProjectChange = () => {
	if (clickLock.value) return;
	clickLock.value = true;
    uni.navigateTo({
        url: '/projectPages/addproject/Index',
		complete: () => {
			clickLock.value = false;
		}
    });
}

// 修改项目
const handleJumpChange = (url: string) => {
	if (clickLock.value) return;
    if (url) {
		clickLock.value = true;
		uni.navigateTo({
		    url,
			complete: () => {
				clickLock.value = false;
			}
		});
	}
}

// 启动、审核项目
async function handleCheckPrjChange(id: number, proname: string, status: number) {
    if (!canUpdate.value) {
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
                type: "error"
            },
        })
        .then(async () => {
            const data = await fetchUpdatePrjInfo([{ id: id, status }]);
            uni.showToast({
                icon: "none",
                title: status === 0 ? '项目核准成功' : status === 3 ? "审核已完成" : '项目启动成功',
                duration: 1500,
                complete: async () => {
					dataForm.page = 1;
                    await getDataList();
					if (status === 3) {
						// store.removeItemByProname(proname, 2);
						store.removeItemById(id);
					}
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
    if (!canDelete.value) {
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
					dataForm.page = 1;
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
    dataForm.page = 1;
    dataForm.fuzzy = decodeURIComponent(data.projectname);
    getDataList();
}

function handleTabbarChange({ value }: { value: string }) {
	if (value !== 'project') {
		if (clickLock.value) return;
		clickLock.value = true;
		setTabbarItemActive(value);
		uni.switchTab({
			url: '/pages/' + activeTabbar.value.name,
			complete: () => {
				clickLock.value = false;
			}
		})
	}
}

// 滚动到顶部
function handleGotoTopChange() {
	nextTick(() => {
		if (activePrjTab.value === 0) {
			scrollTopPrjList.value[activePrjTab.value] = scrollTopStorePrjList.value[activePrjTab.value];
			nextTick(() => {
				scrollTopPrjList.value[activePrjTab.value] = 0;
			})
		} else {
			scrollTop.value = scrollFixedTop.value;
			nextTick(() => {
				scrollTop.value = 0;
			})
		}
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
	console.log('dropMenuRef.value', dropMenuRef.value);
	dropMenuRef.value[0].close();
	handleSearchChange();
}

// 清理你原来的6个存储项
const cleanupOriginalStorage = () => {
	const now = new Date();
	const currentYear = now.getFullYear();
	const currentMonth = now.getMonth() + 1;
	
	// 1. rank_last_shown: 最后一次提示的时间戳
	const lastShownStr = uni.getStorageSync('rank_last_shown');
	if (lastShownStr) {
		const lastShownTime = parseInt(lastShownStr);
		const oneYearAgo = Date.now() - (365 * 24 * 60 * 60 * 1000);
		
		// 如果超过1年没提示，删除这个时间戳
		if (lastShownTime < oneYearAgo) {
			uni.removeStorageSync('rank_last_shown');
		}
	}
	
	// 2. rank_shown_type: 最后一次提示的类型
	// 这个可以和rank_last_shown一起清理
	const lastShownType = uni.getStorageSync('rank_shown_type');
	if (lastShownType && !uni.getStorageSync('rank_last_shown')) {
		uni.removeStorageSync('rank_shown_type');
	}
	
	// 3. rank_shown_year: 最后一次提示的年份
	// 如果记录的是去年或更早，可以删除
	const shownYear = uni.getStorageSync('rank_shown_year');
	if (shownYear && parseInt(shownYear) < currentYear - 1) {
		uni.removeStorageSync('rank_shown_year');
	}
	
	// 4. rank_shown_month: 最后一次提示的月份
	// 如果月份已经过去很久了，可以删除
	const shownMonth = uni.getStorageSync('rank_shown_month');
	if (shownMonth) {
		const shownYear = uni.getStorageSync('rank_shown_year');
		if (shownYear) {
			const year = parseInt(shownYear);
			const month = parseInt(shownMonth);
			const shownDate = new Date(year, month - 1, 1);
			const sixMonthsAgo = new Date();
			sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
			
			if (shownDate < sixMonthsAgo) {
				uni.removeStorageSync('rank_shown_month');
			}
		}
	}
	
	// 5. rank_pending_yearly_2023: 已提示过的年度标记
	// 获取所有年度标记
	const res = uni.getStorageInfoSync();
	const keys = res.keys;
	
	keys.forEach(key => {
		if (key.startsWith('rank_pending_yearly_')) {
			const match = key.match(/rank_pending_yearly_(\d+)/);
			if (match) {
				const year = parseInt(match[1]);
				// 保留最近3年的年度标记
				if (year < currentYear - 2) {
					uni.removeStorageSync(key);
				}
			}
		}
	});
	
	// 6. rank_pending_monthly_2023_12: 已提示过的月度标记
	keys.forEach(key => {
		if (key.startsWith('rank_pending_monthly_')) {
			const match = key.match(/rank_pending_monthly_(\d+)_(\d+)/);
			if (match) {
				const year = parseInt(match[1]);
				const month = parseInt(match[2]);
				const shownDate = new Date(year, month - 1, 1);
				
				// 保留最近12个月的月度标记
				const oneYearAgo = new Date();
				oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
				
				if (shownDate < oneYearAgo) {
					uni.removeStorageSync(key);
				}
			}
		}
	});
}

// 显示祝贺弹窗
const showCongratulations = async () => {
	cleanupOriginalStorage();
	
	// 获取当前日期
	const now = new Date();
	const today = now.toDateString();
	const currentMonth = now.getMonth() + 1; // 1-12
	const currentDate = now.getDate();
	const currentYear = now.getFullYear();
	
	// 获取最后一次显示的记录
	const lastShownStr = uni.getStorageSync('rank_last_shown');
	const lastShownType = uni.getStorageSync('rank_shown_type');
	const lastShownYear = uni.getStorageSync('rank_shown_year');
	const lastShownMonth = uni.getStorageSync('rank_shown_month');
	
	// 判断是否需要显示
	let shouldShow = false;
	let showType = ''; // 'yearly' 或 'monthly'
	let targetYear = currentYear;
	let targetMonth = currentMonth;
	
	// 检查是否是每月1日（显示上月度月度冠军）
	if (currentDate === 1) {
		shouldShow = true;
		showType = 'monthly';
		targetMonth = currentMonth - 1 === 0 ? 12 : currentMonth - 1;
		targetYear = targetMonth === 12 ? currentYear - 1 : currentYear;
		// 如果已经显示过这个月的月度冠军，就不显示了
		if (lastShownType === 'monthly' && 
			lastShownYear === String(targetYear) && 
			lastShownMonth === String(targetMonth)) {
			shouldShow = false;
		}
	}
	// 检查是否是1月1日（显示上年度年度冠军）
	else if (currentMonth === 1 && currentDate === 1) {
		shouldShow = true;
		showType = 'yearly';
		targetYear = currentYear - 1; // 显示上一年度的
		// 如果已经显示过本年度的年度冠军，就不显示了
		if (lastShownType === 'yearly' && lastShownYear === String(targetYear)) {
			shouldShow = false;
		}
	}
	// 如果不是1号，检查是否错过了上次提示
	else {
		// 获取应该提示的日期（最近的1号）
		const lastFirstDay = getLastFirstDay(now);
		
		// 检查是否应该显示年度总结（1月1日错过了）
		if (shouldHaveShownYearly(now, lastFirstDay)) {
			shouldShow = true;
			showType = 'yearly';
			targetYear = currentYear - 1;
			// 如果已经显示过本年度的年度冠军，就不显示了
			if (lastShownType === 'yearly' && lastShownYear === String(targetYear)) {
				shouldShow = false;
			}
		}
		
		// 检查是否应该显示月度总结（上个月1号错过了）
		else if (shouldHaveShownMonthly(now, lastFirstDay)) {
			shouldShow = true;
			showType = 'monthly';
			// 计算上个月的月份和年份
			targetMonth = currentMonth - 1 === 0 ? 12 : currentMonth - 1;
			targetYear = targetMonth === 12 ? currentYear - 1 : currentYear;
			// 如果已经显示过这个月的月度冠军，就不显示了
			if (lastShownType === 'monthly' && 
				lastShownYear === String(targetYear) && 
				lastShownMonth === String(targetMonth)) {
				shouldShow = false;
			}
		}
	}
	
	// 如果需要显示
	if (shouldShow) {
		const userData = await fetchGetAllUserDataList({ page: 1, limit: 100, usertypes: '2, 3, 9' });
		userData.list = userData.list.filter((item: any) => item.status !== 1);
		userData.list.forEach((item: any) => {
			userIdNameObj.value[String(item.id)] = {
				username: item.username,
				userimage: item.userimage || 'https://pms.linkqi.cn:18443/soybean.jpg'
			};
		});
		topListUsers.value = [];
		if (showType == 'yearly') {
			propDate.value = targetYear + '年度';
			const data = await fetchGetSystemHomePageInfo({ s: targetYear });
			// 用Map存储所有creater
			const map: any = new Map();
			
			// 先处理debug数组
			data.debug.forEach((item: any) => {
				map.set(item.creater, { ...item, totalscore: 0 }); // 默认totalscore为0
			});
			
			// 再处理norms数组
			if (data.norms) {
				data.norms.forEach((item: any) => {
					if (map.has(item.creater)) {
						map.set(item.creater, { ...map.get(item.creater), totalscore: item.totalscore }); // 合并totalscore
					} else {
						map.set(item.creater, { debugs: 0, username: null, userimage: null, ...item }); // debug缺失则补默认值
					}
				});
			}
			
			for (const key in userIdNameObj.value) {
				topListUsers.value.push({
					userId: key,
					username: userIdNameObj.value[key].username,
					debugs: map.get(key) ? map.get(key).debugs : 0,
					totalscore: map.get(key) ? map.get(key).totalscore : 0,
					totalCount: (map.get(key) ? map.get(key).debugs : 0) + (map.get(key) ? map.get(key).totalscore : 0),
					userimage: userIdNameObj.value[key].userimage,
				})
			}
			topListUsers.value = topListUsers.value.sort((a: any, b: any) => b.totalCount - a.totalCount);
		} else {
			propDate.value = targetYear + '年' + ((String(targetMonth).length === 1 ? '0' + targetMonth : targetMonth)) + '月';
			const data1 = await fetchGetSystemHomePageInfo({ s: targetYear + '-' + (String(targetMonth).length === 1 ? '0' + targetMonth : targetMonth) });
			// 用Map存储所有creater
			const mapMonth: any = new Map();
			
			// 先处理debug数组
			data1.debug.forEach((item: any) => {
				mapMonth.set(item.creater, { ...item, totalscore: 0, type: showType }); // 默认totalscore为0
			});
			
			// 再处理norms数组
			if (data1.norms) {
				data1.norms.forEach((item: any) => {
					if (mapMonth.has(item.creater)) {
						mapMonth.set(item.creater, { ...mapMonth.get(item.creater), totalscore: item.totalscore }); // 合并totalscore
					} else {
						mapMonth.set(item.creater, { debugs: 0, username: null, userimage: null, ...item }); // debug缺失则补默认值
					}
				});
			}
			
			for (const key in userIdNameObj.value) {
				topListUsers.value.push({
					userId: key,
					username: userIdNameObj.value[key].username,
					debugs: mapMonth.get(key) ? mapMonth.get(key).debugs : 0,
					totalscore: mapMonth.get(key) ? mapMonth.get(key).totalscore : 0,
					totalCount: (mapMonth.get(key) ? mapMonth.get(key).debugs : 0) + (mapMonth.get(key) ? mapMonth.get(key).totalscore : 0),
					userimage: userIdNameObj.value[key].userimage,
				})
			}
			topListUsers.value = topListUsers.value.sort((a: any, b: any) => b.totalCount - a.totalCount);
		}
		
		if (userType.value === 3 || userType.value === 9) {
			let userIndex: number = topListUsers.value.findIndex((item: any) => item.userId === userId.value);
			if (userIndex > 2) {
				return
			}
			topList.value = [{ ...topListUsers.value[userIndex], sort: userIndex + 1 }];
		} else if (userType.value === 0 || userType.value === 2 || userType.value === 4) {
			if (topListUsers.value.length === 1) {
				topList.value = [{ ...topListUsers.value[0], sort: 1 }];
			} else if (topListUsers.value.length === 2) {
				topList.value = [{ ...topListUsers.value[1], sort: 2 }, { ...topListUsers.value[0], sort: 1 }];
			} else if (topListUsers.value.length > 2) {
				topList.value = [{ ...topListUsers.value[1], sort: 2 }, { ...topListUsers.value[0], sort: 1 }, { ...topListUsers.value[2], sort: 3 }];
			}
		}
		// 检查今天是否已经显示过同类型的弹窗
		if (lastShownStr) {
			const lastShownDate = new Date(parseInt(lastShownStr));
			// 如果今天已经显示过，就不显示了
			if (lastShownDate.toDateString() === today) {
				return;
			}
		}
		
		// 延迟显示，等待页面渲染完成
		if (topList.value.length > 0) {
			setTimeout(() => {
				let audioCtx: any = uni.createInnerAudioContext();
				audioCtx.src = '/static/congratulations.mp3';
				audioCtx.play();
				
				// 显示弹窗
				rankModal.value?.showModal();
				
				// 记录显示信息
				uni.setStorageSync('rank_last_shown', now.getTime());
				uni.setStorageSync('rank_shown_type', showType);
				uni.setStorageSync('rank_shown_year', String(targetYear));
				if (showType === 'monthly') {
					uni.setStorageSync('rank_shown_month', String(targetMonth));
				}
				
				// 保存需要提示的月份/年份，避免重复提示
				const pendingKey = showType === 'yearly' ? 
					`rank_pending_yearly_${targetYear}` : 
					`rank_pending_monthly_${targetYear}_${targetMonth}`;
				uni.setStorageSync(pendingKey, 'shown');
			}, 1500);
		}
	}
}

// 获取最近的一个1号
const getLastFirstDay = (date: any) => {
	const year = date.getFullYear();
	const month = date.getMonth() + 1;
	const day = date.getDate();
	
	// 如果今天是1号，返回今天
	if (day === 1) {
		return date;
	}
	
	// 否则返回这个月的1号
	return new Date(year, month - 1, 1);
}

// 判断是否错过了年度总结提示
const shouldHaveShownYearly = (currentDate: any, lastFirstDay: any) => {
	const currentYear = currentDate.getFullYear();
	const currentMonth = currentDate.getMonth() + 1;
	const currentDay = currentDate.getDate();
	
	// 如果现在是1月1日，已经在上面处理了
	if (currentMonth === 1 && currentDay === 1) {
		return false;
	}
	
	// 获取今年1月1日的日期
	const januaryFirst = new Date(currentYear, 0, 1);
	
	// 如果今天在1月1日之后，且没有显示过年度的弹窗
	const lastShownYear = uni.getStorageSync('rank_shown_year');
	const pendingKey = `rank_pending_yearly_${currentYear - 1}`;
	const hasPending = uni.getStorageSync(pendingKey);
	
	// 如果今年1月1日已经过去，且还没显示过年度的弹窗
	if (currentDate > januaryFirst && lastShownYear !== String(currentYear - 1) && !hasPending) {
		return true;
	}
	
	return false;
}

// 判断是否错过了月度总结提示
const shouldHaveShownMonthly = (currentDate, lastFirstDay) => {
	const currentYear = currentDate.getFullYear();
	const currentMonth = currentDate.getMonth() + 1;
	const currentDay = currentDate.getDate();
	
	// 如果今天是1号，已经在上面处理了
	if (currentDay === 1) {
		return false;
	}
	
	// 计算上个月的月份和年份
	let lastMonth = currentMonth - 1;
	let lastMonthYear = currentYear;
	if (lastMonth === 0) {
		lastMonth = 12;
		lastMonthYear = currentYear - 1;
	}
	
	// 获取上个月1日的日期
	const lastMonthFirst = new Date(lastMonthYear, lastMonth - 1, 1);
	
	// 检查是否已经显示过这个月的弹窗
	const lastShownYear = uni.getStorageSync('rank_shown_year');
	const lastShownMonth = uni.getStorageSync('rank_shown_month');
	const pendingKey = `rank_pending_monthly_${lastMonthYear}_${lastMonth}`;
	const hasPending = uni.getStorageSync(pendingKey);
	
	// 如果上个月1日已经过去，且还没显示过这个月的弹窗
	if (currentDate > lastMonthFirst && !(lastShownYear === String(lastMonthYear) && lastShownMonth === String(lastMonth)) && !hasPending) {
		return true;
	}
	
	return false;
}

// 分享回调
const onShare = (res: any) => {
	// #ifdef APP || APP-PLUS || MP-WEIXIN
	if (!res.imgUrl || res.imgUrl === '123') {
		uni.shareWithSystem({
			type: 'text',
			summary: res.data[0].type == 'monthly' ? `调试人员：${res.data[0].username}获得上月积分榜第${res.data[0].sort}名！` : `调试人员：${res.data[0].username}获得上年积分榜第${res.data[0].sort}名！`,
			success: (res) => {
				console.log('分享成功', res)
			}
		})
	} else {
		uni.shareWithSystem({
			type: 'image',
			imageUrl: res.imgUrl,
			summary: res.data[0].type == 'monthly' ? `调试人员：${res.data[0].username}获得上月积分榜第${res.data[0].sort}名！` : `调试人员：${res.data[0].username}获得上年积分榜第${res.data[0].sort}名！`,
			success: (res) => {
				console.log('分享成功', res)
			}
		})
	}
	// #endif
	
	// #ifdef H5
	if (res.imgUrl && res.imgUrl !== '123') {
		window.open(res.imgUrl);
	}
	// #endif
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
	// #ifdef APP || APP-PLUS
	uni.hideTabBar();
	// #endif
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
	if (userType.value === 0 || userType.value === 2 || userType.value === 3 || userType.value === 4) {
		showCongratulations();
	}
    if (uni.getStorageSync('projectname')) {
		activePrjTab.value = 1;
        activeTab.value = 4;
        dataForm.page = 1;
        dataForm.fuzzy = decodeURIComponent(uni.getStorageSync('projectname'));
        getDataList();
        uni.removeStorageSync('projectname');
    }
})

onUnload(() => {
    uni.$off('refreshListPrj', getDataList); // 页面销毁时解绑
});

// 滚动
function handleScrollChange(e: any, index: number) {
	const top = e.detail.scrollTop;
	
	// 项目 tab
	if (activePrjTab.value === 0) {
		scrollTopStorePrjList.value[activePrjTab.value] = top;
	} else {
		scrollFixedTop.value = top;
	}
    // fixedScrollTop.value = e.detail.scrollTop;
	// if (activePrjTab.value === 0) {
	// 	scrollTopPrjList.value[activePrjTab.value] = e.detail.scrollTop;
	// } else {
	// 	if (index === activeTab.value) {
	// 		scrollTopList.value[index] = e.detail.scrollTop;
	// 	}
	// }
};

// 上拉加载
const handleScrollTolowerChange = throttle(async(e: any, index: number) => {
    if (e.detail.direction === "bottom") {
		if (activePrjTab.value === 0) {
			if (recentDataList.value.length < dataForm.recentTotal) {
			    dataForm.recentPage++;
			    getDataList();
			} else if (recentDataList.value.length === dataForm.recentTotal) {
			    dataForm.recentState = 'finished';
			}
		} else {
			if (dataList.value.length < dataForm.total) {
			    dataForm.page++;
			    getDataList();
			} else if (dataList.value.length === dataForm.total) {
			    dataForm.state = 'finished';
			}
		}
    }
}, 1000)

onPullDownRefresh(() => {
	if (activePrjTab.value === 0) {
		dataForm.recentPage = 1;
	} else {
		dataForm.page = 1;
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
						<wd-tab title="近期项目">
							<scroll-view :key="`prj-scroll-${activePrjTab}`" :scroll-y="true" :scroll-top="scrollTopPrjList[activePrjTab]" :style="{ height: scrollViewHeight + 'px' }" @scroll="handleScrollChange($event, activePrjTab)" @scrolltolower="handleScrollTolowerChange($event, activePrjTab)">
								<view v-if="recentDataList.length > 0">
									<uni-swipe-action>
										<uni-swipe-action-item v-for="(recentDataItem, recentDataIndex) in recentDataList" :key="recentDataIndex" :right-options="options" @click="handleDeleteProjectChange(recentDataItem.id)">
											<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: recentDataIndex === recentDataList.length - 1 ? '20rpx 20rpx 40rpx 20rpx' : '20rpx 20rpx 0', borderRadius: '20rpx' }">
												<view style="padding: 20rpx;">
													<view class="prjInfoHeader">
														<view class="left">
															<wd-text bold :text="recentDataItem.proname" size="15px" :color="isDark ? '#ffffff' : '#000000'" />
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
													
													<view style="display: flex; justify-content: flex-end; margin-top: 10rpx; gap: 0 10rpx;">
														<wd-button size="small" type="primary" :loading="loading" @click.stop="handleCanvasToImageChange(recentDataItem.id)">生成工程调试单</wd-button>
														<wd-button size="small" type="primary" @click.stop="handleJumpChange('/projectPages/projectcontractpage/Index?id=' + recentDataItem.id)">关联合同</wd-button>
														<wd-button v-if="canUpdate && recentDataItem.status === -1 && (userType === 0 || (userType === 4 && (userId === '1021' || userId === '1023')))" size="small" type="primary" @click.stop="handleCheckPrjChange(recentDataItem.id, recentDataItem.proname, 0)">核准</wd-button>
														<wd-button v-if="canUpdate && recentDataItem.status === 0 && (userType === 0 || userType === 2 || userType === 3)" size="small" type="primary" @click.stop="handleCheckPrjChange(recentDataItem.id, recentDataItem.proname, 1)">启动</wd-button>
														<wd-button v-if="canUpdate && recentDataItem.status === 2 && (userType === 0 || userType === 2)" size="small" type="primary" @click.stop="handleCheckPrjChange(recentDataItem.id, recentDataItem.proname, 3)">审核</wd-button>
													</view>
												</view>
											</view>
										</uni-swipe-action-item>
									</uni-swipe-action>
								</view>
								<view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
									<wd-status-tip image="../static/search.png" tip="暂无项目" />
								</view>
							</scroll-view>
						</wd-tab>
						
						<wd-tab title="项目列表">
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
							</wd-drop-menu>
							
							<wd-tabs v-model="activeTab" @change="handleSearchChange">
								<wd-tab v-for="(item, index) in tabsList" :key="index" :title="item.title"></wd-tab>
							</wd-tabs>
							
							<scroll-view scroll-y :scroll-top="scrollTop" :style="{ height: scrollViewHeight + 'px' }" @scroll="handleScrollChange" @scrolltolower="handleScrollTolowerChange">
								<view v-if="dataList.length > 0">
									<uni-swipe-action>
										<uni-swipe-action-item v-for="(dataItem, dataIndex) in dataList" :key="dataIndex" :right-options="options" @click="handleDeleteProjectChange(dataItem.id)">
											<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 80rpx)', margin: dataIndex === dataList.length - 1 ? '20rpx 20rpx 40rpx 20rpx' : '20rpx 20rpx 0', borderRadius: '20rpx', padding: '20rpx' }">
												<view class="prjInfoHeader">
													<view class="left">
														<wd-text bold :text="dataItem.hasOwnProperty('dispatch') && dataItem.dispatch ? dataItem.proname + ' (' + dataItem.dispatch + ')' : dataItem.proname" size="15px" :type="dataItem.ptype === 0 ? 'default' : dataItem.ptype === 1 ? 'warning' : 'error'" :color="isDark ? dataItem.ptype === 0 ? '#ffffff' : '' : dataItem.ptype === 0 ? '#000000'  :''" :lines="5" />
													</view>
													<view class="right">
														<wd-text bold :text="dataItem.status === -1 ? '未核准' : dataItem.status === 0 ? '未开始' : dataItem.status === 1 ? '进行中' : dataItem.status === 2 ? '待审核' : dataItem.status === 3 ? '已完成' : '未知'" size="14px" :type="dataItem.status === 0 ? 'default' : dataItem.status === 1 ? 'primary' : dataItem.status === 2 ? 'warning' : dataItem.status === 3 ? 'success' : 'default'" />
														<wd-icon v-if="canUpdate" name="edit-outline" size="18px" @click.stop="handleJumpChange('/projectPages/addproject/Index?id=' + dataItem.id)"></wd-icon>
													</view>
												</view>
												
												<view @click="handleJumpPageChange(dataItem.id, dataItem.proname)">
													<view class="prjInfoClickableHeader">
														<view class="left">
															<wd-icon name="calendar"></wd-icon>
															<view>周期(天)</view>
														</view>
														<view class="right">
															<wd-text bold :text="dataItem.period" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
														</view>
													</view>
													<view v-if="hasPermission('project:DispatchContact:select')" class="prjInfoClickableHeader">
														<view class="left">
															<wd-icon name="transfer"></wd-icon>
															<view>调度信息</view>
														</view>
														<view class="right" @click.stop="handleJumpChange('/projectPages/diapatcherpage/Index?pid=' + dataItem.id)">
															<wd-icon name="view" size="22px"></wd-icon>
														</view>
													</view>
													<view class="prjInfoClickableHeader">
														<view class="left">
															<wd-icon name="list"></wd-icon>
															<view>调试类型</view>
														</view>
														<view class="right">
															<wd-tag type="primary" round>
																{{ dataItem.dtype === 0 ? '现场调试' : dataItem.dtype === 1 ? '远程调试' : dataItem.dtype === 2 ? '无需调试' : '未知' }}
															</wd-tag>
														</view>
													</view>
													
													<view class="prjInfoClickableHeader" @click.stop="handleJumpChange(dataItem.debugs > 0 ? '/projectPages/projectdetail/Index?pid=' + dataItem.id + '&activeTab=2' : '')">
														<view class="left">
															<wd-icon name="a-controlplatform"></wd-icon>
															<view>调试任务数</view>
														</view>
														<view class="right" :style="{ color: dataItem.debugs === 0 ? '#cccccc' : isDark ? '#FFFFFF' : '#000000' }">
															{{ dataItem.debugs }}
														</view>
													</view>
													
													<view class="prjInfoClickableHeader" @click.stop="handleJumpChange(dataItem.summarys > 0 ? '/projectPages/prjsummarypage/Index?pid=' + dataItem.id + '&pname=' + encodeURIComponent(dataItem.proname) : '')">
														<view class="left">
															<wd-icon name="a-controlplatform"></wd-icon>
															<view>项目总结数</view>
														</view>
														<view class="right" :style="{ color: dataItem.summarys === 0 ? '#cccccc' : isDark ? '#FFFFFF' : '#000000' }">
															{{ dataItem.summarys }}
														</view>
													</view>
													
													<view class="prjInfoClickableHeader" @click.stop="handleJumpChange(dataItem.dailys > 0 ? '/mePages/technicalsupportdaily/Index?pid=' + dataItem.id + '&pname=' + encodeURIComponent(dataItem.proname) : '')">
														<view class="left">
															<wd-icon name="a-controlplatform"></wd-icon>
															<view>日报数</view>
														</view>
														<view class="right" :style="{ color: dataItem.dailys === 0 ? '#cccccc' : isDark ? '#FFFFFF' : '#000000' }">
															{{ dataItem.dailys }}
														</view>
													</view>
													
													<view class="prjInfoClickableHeader">
														<view class="left">
															<wd-icon name="time"></wd-icon>
															<view>开始时间</view>
														</view>
														<view class="right" :style="{ color: isDark ? '#FFFFFF' : '#000000' }">
															{{ dataItem.sdbtime || '--' }}
														</view>
													</view>
													
													<view class="prjInfoClickableHeader">
														<view class="left">
															<wd-icon name="user"></wd-icon>
															<view>商务联系人</view>
														</view>
														<view class="right" :style="{ color: isDark ? '#FFFFFF' : '#000000' }">
															{{ dataItem.businesscon || '--' }}
														</view>
													</view>
													
													<view v-if="dataItem.hasOwnProperty('plantime')" class="prjInfoClickableHeader">
														<view class="left">
															<wd-icon name="time"></wd-icon>
															<view>计划调试时间</view>
														</view>
														<view class="right" :style="{ color: isDark ? '#FFFFFF' : '#000000' }">
															{{ dataItem.plantime || '--' }}
														</view>
													</view>
													
													<view class="prjInfoClickableHeader">
														<wd-progress color="#4d80f0" :percentage="dataItem.progess" />
													</view>
												</view>
												
												<wd-gap bg-color="#cccccc" height="2rpx"></wd-gap>
												
												<view style="display: flex; justify-content: flex-end; margin-top: 10rpx; gap: 0 10rpx;">
													<wd-button size="small" type="primary" :loading="loading" @click.stop="handleCanvasToImageChange(dataItem.id)">生成工程调试单</wd-button>
													<view class="fake-btn primary" @click.stop="handleJumpChange('/projectPages/projectcontractpage/Index?id=' + dataItem.id)">
														关联合同
													</view>
													<view v-if="canUpdate && dataItem.status === -1 && (userType === 0 || (userType === 4 && (userId === '1021' || userId === '1023')))" class="fake-btn primary" @click.stop="handleCheckPrjChange(dataItem.id, dataItem.proname, 0)">
														核准
													</view>
													<view v-if="canUpdate && dataItem.status === 0 && (userType === 0 || userType === 2 || userType === 3)" class="fake-btn primary" @click.stop="handleCheckPrjChange(dataItem.id, dataItem.proname, 1)">
														启动
													</view>
													<view v-if="canUpdate && dataItem.status === 2 && (userType === 0 || userType === 2)" size="small" class="fake-btn primary" @click.stop="handleCheckPrjChange(dataItem.id, dataItem.proname, 3)">
														审核
													</view>
												</view>
											</view>
										</uni-swipe-action-item>
									</uni-swipe-action>
								</view>
								<view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
									<wd-status-tip image="../static/search.png" tip="暂无项目" />
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
					</wd-drop-menu>
					
					<wd-tabs v-model="activeTab" @change="handleSearchChange">
						<wd-tab v-for="(item, index) in tabsList" :key="index" :title="item.title"></wd-tab>
					</wd-tabs>
					
					<scroll-view scroll-y :scroll-top="scrollTop" :style="{ height: scrollViewHeight + 'px' }" @scroll="handleScrollChange" @scrolltolower="handleScrollTolowerChange">
						<view v-if="dataList.length > 0">
							<uni-swipe-action>
								<uni-swipe-action-item v-for="(dataItem, dataIndex) in dataList" :key="dataIndex" :right-options="options" @click="handleDeleteProjectChange(dataItem.id)">
									<view v-for="(dataItem, dataIndex) in dataList" :key="dataItem.id">
										<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 80rpx)', margin: dataIndex === dataList.length - 1 ? '20rpx 20rpx 40rpx 20rpx' : '20rpx 20rpx 0', borderRadius: '20rpx', padding: '20rpx' }">
											<view class="prjInfoHeader">
												<view class="left">
													<wd-text bold :text="dataItem.hasOwnProperty('dispatch') && dataItem.dispatch ? dataItem.proname + ' (' + dataItem.dispatch + ')' : dataItem.proname" size="15px" :type="dataItem.ptype === 0 ? 'default' : dataItem.ptype === 1 ? 'warning' : 'error'" :color="isDark ? dataItem.ptype === 0 ? '#ffffff' : '' : dataItem.ptype === 0 ? '#000000'  :''" :lines="5" />
												</view>
												<view class="right">
													<wd-text bold :text="dataItem.status === -1 ? '未核准' : dataItem.status === 0 ? '未开始' : dataItem.status === 1 ? '进行中' : dataItem.status === 2 ? '待审核' : dataItem.status === 3 ? '已完成' : '未知'" size="14px" :type="dataItem.status === 0 ? 'default' : dataItem.status === 1 ? 'primary' : dataItem.status === 2 ? 'warning' : dataItem.status === 3 ? 'success' : 'default'" />
													<wd-icon v-if="canUpdate" name="edit-outline" size="18px" @click.stop="handleJumpChange('/projectPages/addproject/Index?id=' + dataItem.id)"></wd-icon>
												</view>
											</view>
											
											<view @click="handleJumpPageChange(dataItem.id, dataItem.proname)">
												<view class="prjInfoClickableHeader">
													<view class="left">
														<wd-icon name="calendar"></wd-icon>
														<view>周期(天)</view>
													</view>
													<view class="right">
														<wd-text bold :text="dataItem.period" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
													</view>
												</view>
												<view v-if="hasPermission('project:DispatchContact:select')" class="prjInfoClickableHeader">
													<view class="left">
														<wd-icon name="transfer"></wd-icon>
														<view>调度信息</view>
													</view>
													<view class="right" @click.stop="handleJumpChange('/projectPages/diapatcherpage/Index?pid=' + dataItem.id)">
														<wd-icon name="view" size="22px"></wd-icon>
													</view>
												</view>
												<view class="prjInfoClickableHeader">
													<view class="left">
														<wd-icon name="list"></wd-icon>
														<view>调试类型</view>
													</view>
													<view class="right">
														<wd-tag type="primary" round>
															{{ dataItem.dtype === 0 ? '现场调试' : dataItem.dtype === 1 ? '远程调试' : dataItem.dtype === 2 ? '无需调试' : '未知' }}
														</wd-tag>
													</view>
												</view>
												
												<view class="prjInfoClickableHeader" @click.stop="handleJumpChange(dataItem.debugs > 0 ? '/projectPages/projectdetail/Index?pid=' + dataItem.id + '&activeTab=2' : '')">
													<view class="left">
														<wd-icon name="a-controlplatform"></wd-icon>
														<view>调试任务数</view>
													</view>
													<view class="right" :style="{ color: dataItem.debugs === 0 ? '#cccccc' : isDark ? '#FFFFFF' : '#000000' }">
														{{ dataItem.debugs }}
													</view>
												</view>
												
												<view class="prjInfoClickableHeader" @click.stop="handleJumpChange(dataItem.summarys > 0 ? '/projectPages/prjsummarypage/Index?pid=' + dataItem.id + '&pname=' + encodeURIComponent(dataItem.proname) : '')">
													<view class="left">
														<wd-icon name="a-controlplatform"></wd-icon>
														<view>项目总结数</view>
													</view>
													<view class="right" :style="{ color: dataItem.summarys === 0 ? '#cccccc' : isDark ? '#FFFFFF' : '#000000' }">
														{{ dataItem.summarys }}
													</view>
												</view>
												
												<view class="prjInfoClickableHeader" @click.stop="handleJumpChange(dataItem.dailys > 0 ? '/mePages/technicalsupportdaily/Index?pid=' + dataItem.id + '&pname=' + encodeURIComponent(dataItem.proname) : '')">
													<view class="left">
														<wd-icon name="a-controlplatform"></wd-icon>
														<view>日报数</view>
													</view>
													<view class="right" :style="{ color: dataItem.dailys === 0 ? '#cccccc' : isDark ? '#FFFFFF' : '#000000' }">
														{{ dataItem.dailys }}
													</view>
												</view>
												
												<view class="prjInfoClickableHeader">
													<view class="left">
														<wd-icon name="time"></wd-icon>
														<view>开始时间</view>
													</view>
													<view class="right" :style="{ color: isDark ? '#FFFFFF' : '#000000' }">
														{{ dataItem.sdbtime || '--' }}
													</view>
												</view>
												
												<view class="prjInfoClickableHeader">
													<view class="left">
														<wd-icon name="user"></wd-icon>
														<view>商务联系人</view>
													</view>
													<view class="right" :style="{ color: isDark ? '#FFFFFF' : '#000000' }">
														{{ dataItem.businesscon || '--' }}
													</view>
												</view>
												
												<view v-if="dataItem.hasOwnProperty('plantime')" class="prjInfoClickableHeader">
													<view class="left">
														<wd-icon name="time"></wd-icon>
														<view>计划调试时间</view>
													</view>
													<view class="right" :style="{ color: isDark ? '#FFFFFF' : '#000000' }">
														{{ dataItem.plantime || '--' }}
													</view>
												</view>
												
												<view class="prjInfoClickableHeader">
													<wd-progress color="#4d80f0" :percentage="dataItem.progess" />
												</view>
											</view>
											
											<wd-gap bg-color="#cccccc" height="2rpx"></wd-gap>
											
											<view style="display: flex; justify-content: flex-end; margin-top: 10rpx; gap: 0 10rpx;">
												<wd-button size="small" type="primary" :loading="loading" @click.stop="handleCanvasToImageChange(dataItem.id)">生成工程调试单</wd-button>
												<view class="fake-btn primary" @click.stop="handleJumpChange('/projectPages/projectcontractpage/Index?id=' + dataItem.id)">
													关联合同
												</view>
												<view v-if="canUpdate && dataItem.status === -1 && (userType === 0 || (userType === 4 && (userId === '1021' || userId === '1023')))" class="fake-btn primary" @click.stop="handleCheckPrjChange(dataItem.id, dataItem.proname, 0)">
													核准
												</view>
												<view v-if="canUpdate && dataItem.status === 0 && (userType === 0 || userType === 2 || userType === 3)" class="fake-btn primary" @click.stop="handleCheckPrjChange(dataItem.id, dataItem.proname, 1)">
													启动
												</view>
												<view v-if="canUpdate && dataItem.status === 2 && (userType === 0 || userType === 2)" size="small" class="fake-btn primary" @click.stop="handleCheckPrjChange(dataItem.id, dataItem.proname, 3)">
													审核
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
					</scroll-view>
				</view>
			</view>

			<wd-fab draggable v-if="canInsert" position="right-bottom" :gap="{ bottom: 70 }" :expandable="false" @click="handleAddProjectChange"></wd-fab>

			<wd-backtop :bottom="canInsert ? 135 : 70" :scrollTop="activePrjTab === 0 ? scrollTopStorePrjList[activePrjTab] : scrollFixedTop" :zIndex="99" customStyle="background: #007aff; color:white; position: fixed;" @click="handleGotoTopChange"></wd-backtop>
		
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
		
		<Reward ref="rankModal" :propDate="propDate" :top-list="topList" @share="onShare" />
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

.prjInfoClickableHeader{
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin: 20rpx 0 !important;
    // margin-bottom: 20rpx;

    .left {
        display: flex;
        word-break: break-all;
        align-items: center;
        margin-left: 10rpx;
		gap: 0 10rpx;
    }

    .right {
        display: flex;
        flex-direction: row;
        justify-content: flex-end;
        align-items: center;
        gap: 0 10rpx;
		font-weight: bolder;
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
	
	:deep(.wd-tabs__container) {
		background: #000000 !important;
	}
	
	:deep(.uni-scroll-view) {
		background: #000000 !important;
	}
}

.btn-wrapper {
	display: flex;
	justify-content: flex-end;
	padding: 10rpx 30rpx 15rpx 0;
	gap: 0 10rpx;
	background: #ffffff;
}

.btn-wrapper.dark {
	background: #1b1b1b;
}

.fake-btn {
	padding: 8rpx 24rpx;
	font-size: 26rpx;
	border-radius: 32rpx;
	line-height: 1.4;
	text-align: center;
	white-space: nowrap;
	user-select: none;
	transition: opacity 0.15s, transform 0.1s;
}

/* 主按钮 */
.fake-btn.primary {
	background-color: #3a7afe;
	color: #ffffff;
}

/* 危险按钮 */
.fake-btn.danger {
	background-color: #ff4d4f;
	color: #ffffff;
}

/* 点击态 */
.fake-btn:active {
	opacity: 0.75;
	transform: scale(0.96);
}
</style>