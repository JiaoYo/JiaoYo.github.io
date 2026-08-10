<script lang="ts" setup>
import { v4 as uuidv4 } from "uuid";
import { BASE_URL, QINIU_URL, QINIU_UPLOAD_URL } from '@/utils/request';
import { ref, reactive, computed, onMounted, onUnmounted, getCurrentInstance } from 'vue';
import { hasPermission, calcDistance } from '@/utils/index';
import { useI18n } from 'vue-i18n';
import { uploadFile } from '@/utils/uploadFile';
import { useTheme } from '@/composables/theme/theme';
import { onReady, onShow, onPullDownRefresh } from '@dcloudio/uni-app';
import { throttle } from '@/utils/debounce';
import { useTabbar } from '@/composables/useTabbar';
import { blurDetector } from '@/utils/blurDetector.js';
import { fetchGetUserInfo, fetchGetPrjDataList, fetchGetSystemconfigInfo, fetchGetPrjClockinLastInfo, fetchCheckPrjClockinInfo, fetchSavePrjClockinInfo, fetchGetPrjaddressDataList, fetchGetRealtimeTrajectoryInfo, fetchGetAllUserDataList, fetchGetUploadFileTokenInfo } from '@/service/index';

const { activeTabbar, getTabbarItemValue, setTabbarItemActive, tabbarList } = useTabbar();

const { t } = useI18n();

const { themeVars, theme } = useTheme();

const { proxy } = getCurrentInstance();

const isCoolingDown = ref<boolean>(false);

const isCoolingDepartDown = ref<boolean>(false);

const isCoolingArriveDown = ref<boolean>(false);

const isDark = computed(() => theme.value === 'dark');

const isClockIn = ref<boolean>(false);

const prjShow = ref<boolean>(false);

const prjaddressShow = ref<boolean>(false);

const username = ref<string>(uni.getStorageSync('username'));

const userType = ref<number>(uni.getStorageSync('usertype'));

const avatarImage = ref<string>('');

// 保存当前时间
const currentTime = ref<string>('');

const triggered = ref<boolean>(false);

const prjaddressTriggered = ref<boolean>(false);

const requesting = ref<boolean>(false);

const showClockInButton = ref<boolean>(true);

const currentPrjAddress = ref<string>('');

const activeTab = ref<number>(1);

const activeAttendanceTab = ref<number>(1);

const activeDepartArriveTab = ref<number>(0);

const showDepartButton = ref<boolean>(true);

const showArriveButton = ref<boolean>(true);

const isBlur = ref<boolean>(false);

const tabsList = ref<{ title: string, count: number, value: number }[]>([
    {
        title: '全部',
        count: 0,
        value: 0
    },
    {
        title: '外勤',
        count: 0,
        value: 1
    },
    {
        title: '公司',
        count: 0,
        value: 2
    },
    {
        title: '未知',
        count: 0,
        value: 3
    }
]);

const model = reactive<{
    page: number;
    total: number;
    fuzzy: string;
    prjDataList: any;
    checkedPrj: any;
    prjName: string;
    prjaddressPage: number;
    prjaddressTotal: number;
    prjaddressFuzzy: string;
    prjaddressDataList: any;
    checkedPrjaddressDataList: any;
    checkedPrjaddress: any;
    lastClockInInfo: any;
    systemCongfigInfo: any;
    allDataList: any;
    fieldworkDataList: any;
    companyDataList: any;
    unknownDataList: any;
}>({
    page: 1,
    total: 0,
    fuzzy: '',
    prjDataList: [],
    checkedPrj: '',
    prjName: '',
    prjaddressPage: 1,
    prjaddressTotal: 0,
    prjaddressFuzzy: '',
    prjaddressDataList: [],
    checkedPrjaddressDataList: [],
    checkedPrjaddress: -1,
    lastClockInInfo: {
        address: '',
        ctype: 0,
        duration: 0,
        dbtime: '',
        status: 0,
        distanse: 0,
		re1: ''
    },
    systemCongfigInfo: {
        id: 1,
        cputhreshold: 80,
        memthreshold: 95,
        captcha: 0,
        merror: 2000,
        errortime: 60000,
        sdkkey: "e037cc5248967fde6dedabc727d6a591",
        sdkh5: "82a2e36c3671ee597622397929ba0812",
        sdksecret: "5fd44c71fea26a391da96e87f0bbd29b",
        prosite: "杭州领祺科技有限公司（浙江省杭州市钱塘区）",
        longitude: 120.373885,
        latitude: 30.303899,
        ertoken: null,
        diserror: 100
    },
    allDataList: [] as any,
    fieldworkDataList: [] as any,
    companyDataList: [] as any,
    unknownDataList: [] as any
})

const checkedStyle = ref({
    width: '50%',
    textAlign: 'center',
    padding: '20rpx',
    borderRadius: '20rpx',
    // background: isDark.value ? '#131313' : '#ffffff',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
    border: '1px solid #e0e0e0',
    overflow: 'hidden'
})

const unCheckedStyle = ref({
    width: '50%',
    textAlign: 'center',
    padding: '20rpx',
    borderRadius: '20rpx',
    // background: 'transparent',
	// background: isDark.value ? '#131313' : 'transparent',
    overflow: 'hidden'
})

// 格式化函数：时:分:秒
function formatTime(date: Date) {
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');
    return `${h}:${m}:${s}`;
}

const dataForm = reactive({
    longitude: 0,
    latitude: 0,
    prjLongitude: 0,
    prjLatitude: 0
})

let timer: ReturnType<typeof setInterval>;

function updateTime() {
    currentTime.value = formatTime(new Date());
}

// 获取用户基本信息
async function getUserDetailInfo() {
    try {
        const data = await fetchGetUserInfo();
        avatarImage.value = data.userimage || 'https://pms.linkqi.cn:18443/soybean.jpg';
    } catch (err) {
        console.error('获取用户信息失败', err);
        avatarImage.value = 'https://pms.linkqi.cn:18443/soybean.jpg';
    }
}

function handleJumpChange() {
    uni.navigateTo({
        url: '/mePages/attendancestatistics/Index'
    })
}

async function getMapSdkInfo() {
    // const url = process.env.NODE_ENV === 'production' ? 'https://dingiiot.com/map-sdk.json' : '/dingiiotcom/map-sdk.json';

    // try {
    //     const response = await axios.get(`${url}?_t=${Date.now()}`);
    //     return response.data; // ✅ 正确返回 URL
    // } catch (error) {
    //     console.error('获取地图 SDK 配置失败:', error);
    //     throw error; // 让调用者处理错误
    // }
    try {
        const response = await fetchGetSystemconfigInfo();
        return response; // ✅ 正确返回 URL
    } catch (error) {
        console.error('获取地图 SDK 配置失败:', error);
        throw error; // 让调用者处理错误
    }
}

async function getAddress(lat: number, lng: number) {
    const sdkInfo: any = await getMapSdkInfo();
    Object.assign(model.systemCongfigInfo, sdkInfo);
    return new Promise((resolve, reject) => {
        uni.request({
            url: `https://restapi.amap.com/v3/geocode/regeo?key=${sdkInfo.sdkh5}&location=${lng},${lat}`,
            success: (res: any) => {
                resolve(res.data.regeocode?.formatted_address || '');
            },
            fail: reject
        });
    });
}

// 打开弹出层
function handleLinkPrjShowChange() {
    prjShow.value = true;
}

// 清除
function handleClearFuzzyChange() {
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
        const data = await fetchGetPrjDataList({ page: model.page, limit: 100, fuzzy: model.fuzzy }, false);
        model.total = Number(data.total);
        model.prjDataList = model.prjDataList.concat(data.list);
    } catch (error) {
        console.error('获取项目数据失败', error);
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

// 清除选择项
function handleClearPrjChange() {
    model.prjName = '';
    model.checkedPrj = null;
    model.prjaddressDataList = [];
	currentPrjAddress.value = "";
    dataForm.prjLongitude = 0;
    dataForm.prjLatitude = 0;
}

// 选择项目
function handleRadioSelectChange({ value }: { value: any }) {
    console.log('value', value);
    // 获取对应名称
    const names = model.prjDataList.find((item: any) => model.checkedPrj === item.id);
    model.prjName = names ? names.proname : '';
    dataForm.prjLongitude = names ? names.longitude : 0;
    dataForm.prjLatitude = names ? names.latitude : 0;
	currentPrjAddress.value = names.prosite || '';
    prjShow.value = false;
    handleGetClockinLastInfoChange();
    model.prjaddressPage = 1;
    model.checkedPrjaddress = -1;
    model.checkedPrjaddressDataList = [
        {
            id: -1,
            pid: model.checkedPrj,
            addr: '默认项目地址',
            longitude: names.longitude,
            latitude: names.latitude
        }
    ];
}

// 打开项目地点弹出层
function handleLinkPrjaddressShowChange() {
    model.prjaddressPage = 1;
    getPrjAddressDataList();
    prjaddressShow.value = true;
}

// 关闭项目地点弹出层
function handlePrjaddressCloseChange() {
    prjaddressShow.value = false;
}

// 清除项目地点选择项
function handleClearPrjaddressFuzzyChange() {
    model.prjaddressFuzzy = '';
    model.prjaddressPage = 1;
    getPrjAddressDataList();
}

// 搜索项目地点
function handleSearchPrjaddressFuzzyChange() {
    model.prjaddressPage = 1;
    getPrjAddressDataList();
}

// 选择项目地点
async function getPrjAddressDataList() {
    // if (!hasPermission('project:Info:select')) {
    //     return
    // }
    if (model.prjaddressPage === 1) {
        model.prjaddressDataList = [].concat(model.checkedPrjaddressDataList);
    }
    try {
        let queryParams: any = {
            page: model.prjaddressPage,
            limit: 100,
            pid: model.checkedPrj
        }
        if (model.prjaddressFuzzy) {
            queryParams['fuzzy'] = model.prjaddressFuzzy;
        }
        const data = await fetchGetPrjaddressDataList(queryParams);
        model.prjaddressTotal = Number(data.total);
        model.prjaddressDataList = model.prjaddressDataList.concat(data.list);
    } catch (error) {
        console.error('获取项目数据失败', error);
    }
}

// 刷新
function handleScrollPrjaddressRefreshChange() {
    prjaddressTriggered.value = true;
    model.prjaddressPage = 1;
    getPrjAddressDataList();
    setTimeout(() => {
        prjaddressTriggered.value = false;
        console.log('刷新完成');
    }, 1000)
}

// 滚动到底部
function handleScrollPrjaddresstolowerChange(e: any) {
    console.log('e', e);
    if (e.detail.direction === 'bottom' && model.prjaddressDataList.length < model.prjaddressTotal) {
        model.prjaddressPage++;
        getPrjAddressDataList();
    }
}

// 选择项目地点
function handleRadioPrjaddressSelectChange({ value }: { value: any }) {
    console.log('value', value);
    // 获取对应名称
    const names = model.prjaddressDataList.find((item: any) => model.checkedPrjaddress === item.id);
    dataForm.prjLongitude = names ? names.longitude : 0;
    dataForm.prjLatitude = names ? names.latitude : 0;
	currentPrjAddress.value = names.addr;
    prjaddressShow.value = false;
}

// 签到
const handleDepartOrArriveClockinChange = (val: string) => {
    if (!model.checkedPrj) {
        uni.showToast({
            icon: 'none',
            title: '请您先选择项目再签到',
            duration: 1500
        });
        return
    }
    if (!hasPermission('project:Clockin:insert')) {
        uni.showToast({
            icon: 'none',
            title: '暂无签到权限，请联系管理员',
            duration: 1500
        });
        if (val === 'depart') {
            isCoolingDepartDown.value = false;
        } else {
            isCoolingArriveDown.value = false;
        }
        return;
    }
	
	if (model.lastClockInInfo.status === 2 && model.lastClockInInfo.ctype === 0 && val === 'depart') {
		uni.showToast({
		    icon: 'none',
		    title: '您已点击出发，请先点击到达再操作。',
		    duration: 1500
		});
		return;
	}
	
	if (model.lastClockInInfo.status === 3 && model.lastClockInInfo.ctype === 1 && val !== 'depart') {
		uni.showToast({
		    icon: 'none',
		    title: '您已点击到达，请先点击出发再操作。',
		    duration: 1500
		});
		return;
	}
	
	if (isClockIn.value && (model.lastClockInInfo.status === 0 || model.lastClockInInfo.status === 1) && model.lastClockInInfo.ctype === 0) {
		uni.showToast({
		    icon: 'none',
		    title: '您还未点击打卡，请先点击打卡再进行其余操作。',
		    duration: 1500
		});
		return;
	}

    if (val === 'depart') {
        // 如果在冷却期，给提示并返回
        if (isCoolingDepartDown.value) {
            uni.showToast({
                icon: 'none',
                title: '操作过于频繁，请稍后再试',
                duration: 1500
            });
            return;
        }
    } else {
        // 如果在冷却期，给提示并返回
        if (isCoolingArriveDown.value) {
            uni.showToast({
                icon: 'none',
                title: '操作过于频繁，请稍后再试',
                duration: 1500
            });
            return;
        }
    }

    // 执行实际的签到逻辑
    handleAttendanceDepartOrArriveClockinExecuteChange(val);
};

// 实际签到
const handleAttendanceDepartOrArriveClockinExecuteChange = throttle(async (val: string) => {
    if (val === 'depart') {
        isCoolingDepartDown.value = true;
    } else {
        isCoolingArriveDown.value = true;
    }
    uni.getLocation({
        type: 'gcj02',
        geocode: true,
        isHighAccuracy: true,
        highAccuracyExpireTime: 10000,
        success: async (res) => {
            try {
                dataForm.longitude = res.longitude;
                dataForm.latitude = res.latitude;
                const address: any = await getAddress(res.latitude, res.longitude);
                await fetchSavePrjClockinInfo({
                    list: [{
                        address,
                        pid: model.checkedPrj,
                        longitude: res.longitude,
                        latitude: res.latitude,
                        devtime: new Date().getTime(),
                    }],
                    check: false,
                    status: val === 'depart' ? 2 : 3
                });
                if (val === 'depart') {
                    showDepartButton.value = false;
                } else {
                    showArriveButton.value = false;
                }
                uni.showToast({
                    title: val === 'depart' ? '出发签到成功' : '到达签到成功',
                    icon: 'none',
                    duration: 1500,
					success: () => {
						handleGetClockinLastInfoChange();
					}
                });
                setTimeout(() => {
                    if (val === 'depart') {
                        showDepartButton.value = true;
                        isCoolingDepartDown.value = false;
                    } else {
                        showArriveButton.value = true;
                        isCoolingArriveDown.value = false;
                    }
                }, 60000);
            } catch(err: any) {
                // success 分支内部出错（接口、地址解析等） → 告诉 throttle：失败，不冷却
                console.error((val === 'depart' ? '出发' : '到达') + '签到失败', err);
                uni.showToast({
                    icon: 'none',
                    title: err?.message || String(err) || '签到失败，请重试',
                    duration: 1500
                });
                if (val === 'depart') {
                    showDepartButton.value = true;
                    isCoolingDepartDown.value = false;
                } else {
                    showArriveButton.value = true;
                    isCoolingArriveDown.value = false;
                }
            }
        },
        fail: (error) => {
            console.log('error', error);
            uni.showToast({
                icon: 'none',
                title: '获取位置失败，请检查定位权限',
                duration: 1500
            });
            if (val === 'depart') {
                showDepartButton.value = true;
                isCoolingDepartDown.value = false;
            } else {
                showArriveButton.value = true;
                isCoolingArriveDown.value = false;
            }
        }
    });
}, 2000);

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
				},
				"clockinImage"
			);
		});
	});

	return Promise.all(tasks);
}

// // 检测是否模糊
// const detectBlur = (imgPath, callback) => {
// 	return new Promise((resolve) => {
// 		const ctx = uni.createCanvasContext('cvs', proxy)
// 		const size = 120

// 		ctx.drawImage(imgPath, 0, 0, size, size)
// 		ctx.draw(false, () => {
// 			uni.canvasGetImageData({
// 				canvasId: 'cvs',
// 				x: 0,
// 				y: 0,
// 				width: size,
// 				height: size,
// 				success: (res) => {
// 					const r = calc(res)

// 					const result = {
// 						score: r.score,
// 						isBlur: r.score < 35
// 					}

// 					// ✅ 回调
// 					callback && callback(result)

// 					// ✅ Promise
// 					resolve(result)
// 				}
// 			})
// 		})
// 	})
// }

// // ⭐ 核心算法（不变）
// const calc = (imageData: any) => {
// 	const d = imageData.data;
// 	const w = imageData.width;
// 	const h = imageData.height;

// 	let sumDiff = 0;
// 	let sumContrast = 0;
// 	let count = 0;

// 	for (let y = 0; y < h - 1; y++) {
// 		for (let x = 0; x < w - 1; x++) {
// 			const i = (y * w + x) * 4

// 			const g1 = (d[i] + d[i + 1] + d[i + 2]) / 3
// 			const g2 = (d[i + 4] + d[i + 5] + d[i + 6]) / 3
// 			const g3 = (d[i + w * 4] + d[i + w * 4 + 1] + d[i + w * 4 + 2]) / 3

// 			const diff = Math.abs(g1 - g2) + Math.abs(g1 - g3)

// 			sumDiff += diff
// 			sumContrast += Math.abs(g1 - 128)
// 			count++
// 		}
// 	}

// 	const sharpness = sumDiff / count;
// 	const contrast = sumContrast / count;

// 	const score = sharpness * 0.7 + contrast * 0.3;

// 	return {
// 		score: Math.round(score)
// 	}
// }


// ===============================
// 🚀 主检测函数（生产级）
// ===============================
// const detectBlur = (imgPath) => {
//   return new Promise((resolve) => {
//     const ctx = uni.createCanvasContext("cvs");

//     uni.getImageInfo({
//       src: imgPath,
//       success: (info) => {
//         const w = 240;
//         const h = Math.round((info.height / info.width) * w);

//         ctx.drawImage(imgPath, 0, 0, w, h);

//         ctx.draw(false, () => {
//           uni.canvasGetImageData({
//             canvasId: "cvs",
//             x: 0,
//             y: 0,
//             width: w,
//             height: h,
//             success: (res) => {
//               if (!res?.data?.length) {
//                 resolve({ isReject: false });
//                 return;
//               }

//               const { faceScore, globalScore } = analyzeImage(res.data, w, h);

//               console.log("faceScore:", faceScore);
//               console.log("globalScore:", globalScore);

//               // 🚨 核心判断逻辑
//               const isReject =
//                 faceScore < 40 || globalScore < 30;

//               resolve({
//                 isReject,
//                 faceScore,
//                 globalScore
//               });
//             },

//             fail: () => resolve({ isReject: false })
//           });
//         });
//       },
//       fail: () => resolve({ isReject: false })
//     });
//   });
// };

// // =====================
// // 核心分析（人脸模拟区域 + 全图）
// // =====================
// const analyzeImage = (data, width, height) => {
// 	const gray = [];

// 	for (let i = 0; i < data.length; i += 4) {
// 		gray.push(data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11);
// 	}

// 	const w = width;

// 	const faceRegion = [];   // 中间区域（模拟人脸）
// 	const globalLap = [];

// 	// 👇 重点：中间区域 = 人脸区域（证件照默认脸在中间）
// 	const xStart = Math.floor(w * 0.2);
// 	const xEnd = Math.floor(w * 0.8);
// 	const yStart = Math.floor(height * 0.2);
// 	const yEnd = Math.floor(height * 0.8);

// 	for (let y = 1; y < height - 1; y++) {
// 		for (let x = 1; x < w - 1; x++) {
// 			const i = y * w + x;
			
// 			const v = (gray[i - w] || 0) + (gray[i - 1] || 0) - 4 * (gray[i] || 0) + (gray[i + 1] || 0) + (gray[i + w] || 0);

// 			if (!isNaN(v)) {
// 				globalLap.push(v);

// 				// 👇 模拟人脸区域
// 				if (x >= xStart && x <= xEnd && y >= yStart && y <= yEnd) {
// 					faceRegion.push(v);
// 				}
// 			}
// 		}
// 	}

// 	const faceScore = calcVar(faceRegion);
// 	const globalScore = calcVar(globalLap);
// 	return { faceScore, globalScore };
// };

// // =====================
// // 方差计算（安全版）
// // =====================
// const calcVar = (arr) => {
// 	if (!arr || arr.length === 0) return 0;
// 	const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
// 	const variance = arr.reduce((sum, v) => sum + (v - mean) ** 2, 0) / arr.length;
// 	return isNaN(variance) ? 0 : variance;
// };
const detectBlur = (imgPath) => {
  return new Promise((resolve) => {
    const ctx = uni.createCanvasContext("cvs");

    uni.getImageInfo({
      src: imgPath,
      success: (info) => {
        // 缩小图片：为了计算快，缩小到宽240
        const w = 240;
        const h = Math.round((info.height / info.width) * w);

        ctx.drawImage(imgPath, 0, 0, w, h);

        ctx.draw(false, () => {
          // 获取像素数据
          uni.canvasGetImageData({
            canvasId: "cvs",
            x: 0,
            y: 0,
            width: w,
            height: h,
            success: (res) => {
              const data = res.data;
              const width = res.width;
              const height = res.height;

              // 1. 灰度化
              const gray = new Uint8Array(width * height);
              for (let i = 0; i < data.length; i += 4) {
                const p = i / 4;
                // 灰度公式
                gray[p] = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
              }

              // 2. 拉普拉斯算子计算清晰度
              const laplacianValues = [];

              for (let y = 1; y < height - 1; y++) {
                for (let x = 1; x < width - 1; x++) {
                  const i = y * width + x;
                  // 简化的拉普拉斯卷积核
                  const val =
                    4 * gray[i] -
                    gray[i - 1] -
                    gray[i + 1] -
                    gray[i - width] -
                    gray[i + width];

                  // 取绝对值，忽略负数
                  laplacianValues.push(Math.abs(val));
                }
              }

              // 3. 排序找中位数（这是核心！）
              laplacianValues.sort((a, b) => a - b);
              const midIndex = Math.floor(laplacianValues.length / 2);
              const medianScore = laplacianValues[midIndex];

              // 🚨 关键调试信息：看这里！
              console.log(`📊 [调试] 图片计算出的中位数分数: ${medianScore}`);

              // 4. 判定逻辑
              // 这里的 50 是经验值，如果上面的 log 显示分数很低，我们就调低它
              const THRESHOLD = 30;
              const isReject = medianScore < THRESHOLD;

              resolve({
                isReject: isReject, // true 为模糊(拦截), false 为清晰(通过)
                score: medianScore.toFixed(2),
                reason: isReject ? "图片模糊" : "清晰",
              });
            },
            fail: (err) => {
              console.error("获取图像数据失败", err);
              resolve({ isReject: true, reason: "系统错误" });
            },
          });
        });
      },
      fail: (err) => {
        console.error("获取图片信息失败", err);
        resolve({ isReject: true, reason: "图片错误" });
      },
    });
  });
};

// 考勤打卡
const handleAttendanceClockinChange = () => {
    if (!hasPermission('project:Clockin:insert')) {
        uni.showToast({
            icon: 'none',
            title: '暂无打卡权限，请联系管理员',
            duration: 1500
        });
        isCoolingDown.value = false;
        return;
    }
	
	if (model.lastClockInInfo.status === 2) {
		uni.showToast({
		    icon: 'none',
		    title: '您还未点击到达，请先点击到达再打卡。',
		    duration: 1500
		});
		return;
	}

    // 如果在冷却期，给提示并返回
    if (isCoolingDown.value) {
        uni.showToast({
            icon: 'none',
            title: '操作过于频繁，请稍后再试',
            duration: 1500
        });
        return;
    }
	
	uni.chooseImage({
		count: 1,
		sourceType: ["camera"],
		success: async (res) => {
			// console.log(JSON.stringify(res.tempFilePaths));
			console.log('res', res);
			const path = res.tempFilePaths[0];
			const canvasOptions = {
				  canvasId: 'blurDetectCanvas'
			}
			// const result = await detectBlur(path);
			// console.log('resultresultresult', result);
			// if (result.isBlur) {
			// 	uni.showModal({
			// 		title: '提示',
			// 		content: '图片不清晰，请重新拍摄',
			// 		showCancel: false
			// 	})
			// 	return
			// }
			const result = await blurDetector.detect(path, 1000, canvasOptions);
			console.log('resultresultresult', result);
			if (result.isBlur) {
				uni.showModal({
					title: '提示',
					content: '图片不清晰，请重新拍摄',
					showCancel: false
				})
				return
			}
			const tempFile = res.tempFiles[0];
			const tokenInfo = await fetchGetUploadFileTokenInfo();
			// 截取最后一个 '/' 后面的内容
			const tempName = path.substring(path.lastIndexOf('/') + 1);
			let fileTransName = "";
			// 简单校验：如果截取出来的名字包含 '.' (有后缀)，通常可用
			// 小程序里有时截取出来是 wxfile://... 这种，没有后缀，就不太准
			if (tempName.includes('.')) {
				fileTransName = tempName;
			} else {
				// 3. 兜底方案：如果上述都拿不到，生成一个带时间戳的假名字
				// 或者提示用户手动输入
				fileTransName = 'image_' + Date.now() + '.jpg'; 
			}
	
			console.log('最终文件名:', fileTransName);
			const fileName = 'work-project/clockinImage/' + uuidv4() + '/' + fileTransName;
			uni.uploadFile({
				url: QINIU_UPLOAD_URL,
				// 直接将 tempFile 对象传给 filePath
				filePath: path, 
				name: 'file',
				formData: { token: tokenInfo, key: fileName },
				success: (uploadRes) => {
					console.log('上传成功', uploadRes);
					let data = typeof uploadRes.data === 'string' ? JSON.parse(uploadRes.data) : uploadRes.data;
					if (data.key) {
						const dataRes = QINIU_URL + data.key + '?' + fileName;
						// 执行实际的打卡逻辑
						handleAttendanceClockinExecuteChange(dataRes);
					}
				},
				fail: (err) => {
					console.error('上传失败', err);
					showClockInButton.value = true;
					isCoolingDown.value = false;
				}
			});
			// const [res1] = await Promise.all([
			// 	handleUploadFileListChange([Object.assign(res.tempFiles[0], { url: res.tempFilePaths[0] })])
			// ]);
			// console.log('res1', res1);
			// let fileUrl = res1.length > 0 ? res1[0].url : '';
			// console.log('fileUrl', fileUrl);
			// 执行实际的打卡逻辑
			// handleAttendanceClockinExecuteChange(fileUrl);
		},
		fail: () => {
			showClockInButton.value = true;
			isCoolingDown.value = false;
		}
	})

    // 执行实际的打卡逻辑
    // handleAttendanceClockinExecuteChange();
};

// 考勤打卡
const handleAttendanceClockinExecuteChange = throttle(async (fileUrl: string) => {
    isCoolingDown.value = true;
    uni.getLocation({
        type: 'gcj02',
        geocode: true,
        isHighAccuracy: true,
        highAccuracyExpireTime: 10000,
        success: async (res) => {
            try {
                dataForm.longitude = res.longitude;
                dataForm.latitude = res.latitude;
                console.log('res', res);
                if (!model.checkedPrj) {
                    const checkResult = calcDistance(
                        dataForm.latitude,
                        dataForm.longitude,
                        dataForm.prjLatitude,
                        dataForm.prjLongitude,
                        model.systemCongfigInfo.diserror
                    );
                    const address: any = await getAddress(dataForm.latitude, dataForm.longitude);
                    await fetchSavePrjClockinInfo({
                        list: [{
                            address,
                            longitude: dataForm.longitude,
                            latitude: dataForm.latitude,
                            devtime: new Date().getTime(),
							re1: fileUrl
                        }],
                        check: checkResult
                    });
                    showClockInButton.value = false;
                    if (!isClockIn.value) {
                        uni.$emit("locationPositionChange", {
                            pid: model.checkedPrj
                        });
                    } else {
                        uni.$emit("locationPositionCloseChange");
                    }
                    uni.showToast({
                        title: (isClockIn.value ? '下班' : '上班') + '打卡成功',
                        icon: 'none',
                        duration: 1500,
                        complete: () => {
                            handleGetClockinLastInfoChange();
                        }
                    });
                    setTimeout(() => {
                        showClockInButton.value = true;
                        isCoolingDown.value = false;
                    }, 60000);
                } else {
                    if (!dataForm.prjLatitude || !dataForm.prjLongitude) {
                        isCoolingDown.value = false;
                        uni.showToast({
                            title: '禁止打卡, 请联系管理员',
                            icon: 'none',
                            duration: 1500
                        });
                        return;
                    } else {
                        const checkResult = calcDistance(
                            dataForm.latitude,
                            dataForm.longitude,
                            dataForm.prjLatitude,
                            dataForm.prjLongitude,
                            model.systemCongfigInfo.merror
                        );
                        const address: any = await getAddress(dataForm.latitude, dataForm.longitude);
                        await fetchSavePrjClockinInfo(model.checkedPrjaddress === -1 ? {
                            list: [{
                                pid: model.checkedPrj,
                                address,
                                longitude: dataForm.longitude,
                                latitude: dataForm.latitude,
                                devtime: new Date().getTime(),
								re1: fileUrl
                            }],
                            check: checkResult
                        } : {
                            list: [{
                                pid: model.checkedPrj,
                                address,
                                addrid: model.checkedPrjaddress,
                                longitude: dataForm.longitude,
                                latitude: dataForm.latitude,
                                devtime: new Date().getTime()
                            }],
                            check: checkResult
                        });
                        showClockInButton.value = false;
                        if (!isClockIn.value) {
                            uni.$emit("locationPositionChange", {
                                pid: model.checkedPrj
                            });
                        } else {
                            uni.$emit("locationPositionCloseChange");
                        }
                        uni.showToast({
                            title: (isClockIn.value ? '下班' : '上班') + '打卡成功',
                            icon: 'none',
                            duration: 1500,
                            complete: () => {
                                handleGetClockinLastInfoChange();
                            }
                        });
                        setTimeout(() => {
                            showClockInButton.value = true;
                            isCoolingDown.value = false;
                        }, 60000);
                    }
                }
            } catch(err: any) {
                // success 分支内部出错（接口、地址解析等） → 告诉 throttle：失败，不冷却
                console.error((isClockIn.value ? '下班' : '上班') + '打卡失败', err);
                uni.showToast({
                    icon: 'none',
                    title: err?.message || String(err) || '打卡失败，请重试',
                    duration: 1500
                });
                showClockInButton.value = true;
                isCoolingDown.value = false;
            }
        },
        fail: (error) => {
            console.log('error', error);
            uni.showToast({
                icon: 'none',
                title: '获取位置失败，请检查定位权限',
                duration: 1500
            });
            showClockInButton.value = true;
            isCoolingDown.value = false;
        }
    });
}, 2000);
// const handleAttendanceClockinChange = throttle((resolve, reject) => {
//     if (!hasPermission('project:Clockin:insert')) {
//         uni.showToast({
//             icon: 'none',
//             title: '暂无打卡权限，请联系管理员',
//             duration: 1500
//         });
//         reject(); // 权限不足不冷却
//         return;
//     }

//     uni.getLocation({
//         type: 'gcj02',
//         geocode: true,
//         isHighAccuracy: true,
//         success: async (res) => {
//             try {
//                 dataForm.longitude = res.longitude;
//                 dataForm.latitude = res.latitude;
//                 console.log('res', res);
//                 if (!model.checkedPrj) {
//                     const checkResult = calcDistance(
//                         dataForm.latitude,
//                         dataForm.longitude,
//                         dataForm.prjLatitude,
//                         dataForm.prjLongitude,
//                         model.systemCongfigInfo.diserror
//                     );
//                     const address: any = await getAddress(dataForm.latitude, dataForm.longitude);
//                     await fetchSavePrjClockinInfo({
//                         list: [{
//                             address,
//                             longitude: dataForm.longitude,
//                             latitude: dataForm.latitude,
//                             devtime: new Date().getTime()
//                         }],
//                         check: checkResult
//                     });
//                     showClockInButton.value = false;
//                     // if (!isClockIn.value) {
//                     //     uni.$emit("locationPositionChange", {
//                     //         pid: model.checkedPrj
//                     //     });
//                     // } else {
//                     //     uni.$emit("locationPositionCloseChange");
//                     // }
//                     uni.showToast({
//                         title: (isClockIn.value ? '下班' : '上班') + '打卡成功',
//                         icon: 'none',
//                         duration: 1500,
//                         complete: () => {
//                             handleGetClockinLastInfoChange();
//                         }
//                     });
//                     setTimeout(() => {
//                         showClockInButton.value = true;
//                     }, 60000);

//                     // 打卡成功 → 告诉 throttle：成功，可以冷却
//                     resolve();
//                 } else {
//                     if (!dataForm.prjLatitude || !dataForm.prjLongitude) {
//                         uni.showToast({
//                             title: '禁止打卡, 请联系管理员',
//                             icon: 'none',
//                             duration: 1500
//                         });
//                         reject(); // 禁止打卡不冷却
//                         return;
//                     } else {
//                         const checkResult = calcDistance(
//                             dataForm.latitude,
//                             dataForm.longitude,
//                             dataForm.prjLatitude,
//                             dataForm.prjLongitude,
//                             model.systemCongfigInfo.merror
//                         );
//                         const address: any = await getAddress(dataForm.latitude, dataForm.longitude);
//                         await fetchSavePrjClockinInfo(model.checkedPrjaddress === -1 ? {
//                             list: [{
//                                 pid: model.checkedPrj,
//                                 address,
//                                 longitude: dataForm.longitude,
//                                 latitude: dataForm.latitude,
//                                 devtime: new Date().getTime()
//                             }],
//                             check: checkResult
//                         } : {
//                             list: [{
//                                 pid: model.checkedPrj,
//                                 address,
//                                 addrid: model.checkedPrjaddress,
//                                 longitude: dataForm.longitude,
//                                 latitude: dataForm.latitude,
//                                 devtime: new Date().getTime()
//                             }],
//                             check: checkResult
//                         });
//                         showClockInButton.value = false;
//                         // if (!isClockIn.value) {
//                         //     uni.$emit("locationPositionChange", {
//                         //         pid: model.checkedPrj
//                         //     });
//                         // } else {
//                         //     uni.$emit("locationPositionCloseChange");
//                         // }
//                         uni.showToast({
//                             title: (isClockIn.value ? '下班' : '上班') + '打卡成功',
//                             icon: 'none',
//                             duration: 1500,
//                             complete: () => {
//                                 handleGetClockinLastInfoChange();
//                             }
//                         });
//                         setTimeout(() => {
//                             showClockInButton.value = true;
//                         }, 60000);

//                         // 打卡成功 → 告诉 throttle：成功，可以冷却
//                         resolve();
//                     }
//                 }
//             } catch(err: any) {
//                 // success 分支内部出错（接口、地址解析等） → 告诉 throttle：失败，不冷却
//                 console.error((isClockIn.value ? '下班' : '上班') + '打卡失败', err);
//                 uni.showToast({
//                     icon: 'none',
//                     title: err?.message || String(err) || '打卡失败，请重试',
//                     duration: 1500
//                 });
//                 showClockInButton.value = true;
//                 reject();
//             }
//         },
//         fail: (error) => {
//             console.log('error', error);
//             uni.showToast({
//                 icon: 'none',
//                 title: '获取位置失败，请检查定位权限',
//                 duration: 1500
//             });
//             showClockInButton.value = true;
//             reject(); // 获取位置失败不冷却
//         }
//     });
// }, 60000, { // 冷却时间改为60秒
//     onCoolingDown: () => {
//         uni.showToast({
//             icon: 'none',
//             title: '操作过于频繁，请稍后再试',
//             duration: 1500
//         });
//     }
// });

// 获取上次打卡信息
async function handleGetClockinLastInfoChange() {
    if (!hasPermission('project:Clockin:select')) {
        return
    }
    try {
        let queryParams: any = {};
        if (model.checkedPrj) {
            queryParams['pid'] = model.checkedPrj;
        }
        const data = await fetchGetPrjClockinLastInfo(queryParams);
        if (!data) {
            isClockIn.value = false;
            model.lastClockInInfo.address = '';
            model.lastClockInInfo.ctype = 0;
            model.lastClockInInfo.dbtime = '';
            model.lastClockInInfo.status = 0;
            model.lastClockInInfo.duration = 0;
            model.lastClockInInfo.distanse = 0;
			model.lastClockInInfo.re1 = "";
        } else {
            isClockIn.value = data.status === 0 || data.status === 1 ? data.ctype === 0 ? true : false : false;
            model.lastClockInInfo.address = data.address;
            model.lastClockInInfo.ctype = data.ctype;
            model.lastClockInInfo.dbtime = data.dbtime;
            model.lastClockInInfo.status = data.status;
            model.lastClockInInfo.duration = data.duration || 0;
            model.lastClockInInfo.distanse = data.distanse || 0;
			model.lastClockInInfo.re1 = data.re1 || "";
        }
    } catch (error) {
        console.error('获取上次打卡信息失败', error);
    }
}

// 获取工程技术人员信息 && 实时轨迹
// status: 1 = 外勤, 2 = 公司, 3 = 未知
async function getDataList() {
    model.allDataList = [];
    model.fieldworkDataList = [];
    model.companyDataList = [];
    model.unknownDataList = [];

    try {
        const data = await fetchGetAllUserDataList({ page: 1, limit: 100, usertypes: '2, 3, 9' });
        const realtimeTrajectoryData = await fetchGetRealtimeTrajectoryInfo();
        // 如果没有任何实时轨迹 → 全部未知
        if (!realtimeTrajectoryData || realtimeTrajectoryData.length === 0) {
            model.allDataList = data.list.map((item: any) => ({ ...item, status: 3 }));
            model.unknownDataList = [...model.allDataList];
            return;
        }

        // 建立 pid 映射表，便于快速查找
        const rtMap = new Map();
        realtimeTrajectoryData.forEach((rt: any) => {
            rtMap.set(rt.creater, rt); // 假设 realtimeTrajectoryData 里 userid 对应 dataItem.id
        });

        const allUserList = data.list.filter((item: any) => item.status === 0);

        allUserList.forEach((item: any) => {
            const rtInfo = rtMap.get(item.id); // 匹配是否有实时位置信息

            let status = 3;  // 默认未知
            let merged: any = { ...item };

            if (rtInfo) {
                // 合并轨迹信息
                merged = {
                    ...merged,
                    address: rtInfo.address,
                    pid: rtInfo.pid,
                    proname: rtInfo.proname,
                    userimage: rtInfo.userimage,
                    dbtime: rtInfo.dbtime,
                    longitude: rtInfo.longitude,
                    latitude: rtInfo.latitude
                };

                if (rtInfo.pid === -1) {
                    status = 2; // 公司
                } else {
                    status = 1; // 外勤
                }
            }

            merged.status = status;

            // 放入总列表
            model.allDataList.push(merged);

            // 分类
            if (status === 1) model.fieldworkDataList.push(merged);
            if (status === 2) model.companyDataList.push(merged);
            if (status === 3) model.unknownDataList.push(merged);
        });

        tabsList.value[0].count = model.allDataList.length;
        tabsList.value[1].count = model.fieldworkDataList.length;
        tabsList.value[2].count = model.companyDataList.length;
        tabsList.value[3].count = model.unknownDataList.length;
    } catch (err) {
        console.error('获取工程技术人员信息失败', err);
    }
}

function handleTabbarChange({ value }: { value: string }) {
	if (value !== 'attendance') {
		setTabbarItemActive(value);
		uni.switchTab({
			url: '/pages/' + activeTabbar.value.name
		})
	}
}

onMounted(async() => {
    if (userType.value !== 0 && userType.value !== 4) {
        // 初始赋值
        updateTime();

        // 每秒更新一次
        timer = setInterval(updateTime, 1000);
        model.page = 1;
        getPrjDataList();
    }
});

onUnmounted(() => {
    // 离开页面时清理定时器
    timer && clearInterval(timer);
});

onReady(() => {
	// #ifdef APP || APP-PLUS
	uni.hideTabBar();
	// #endif
})

onShow(() => {
    if (userType.value === 0 || userType.value === 4) {
        getDataList();
    } else {
        getUserDetailInfo();
        handleGetClockinLastInfoChange();
        // uni.getLocation({
        //     type: 'gcj02',
        //     geocode: true,
        //     isHighAccuracy: true,
        //     highAccuracyExpireTime: 10000,
        //     success: (res) => {
        //         dataForm.longitude = res.longitude;
        //         dataForm.latitude = res.latitude;
        //     },
        //     fail: (error) => {
        //         console.log(error);
        //     }
        // });
    }
});

onPullDownRefresh(() => {
    if (userType.value === 0 || userType.value === 4) {
        getDataList();
    } else {
        getUserDetailInfo();
    }
	setTimeout(() => {
	    uni.hideNavigationBarLoading(); // 完成停止加载
	    uni.stopPullDownRefresh();
	}, 1000);
})
</script>

<template>
	<wd-config-provider :theme-vars="themeVars" custom-style="min-height: 100vh" :theme="theme">
		<wd-navbar title="考勤" safe-area-inset-top placeholder fixed :bordered="false" />
		
		<view v-if="userType === 0 || userType === 4">
			<wd-tabs swipeable animated v-model="activeTab">
				<block v-for="(item, index) in tabsList" :key="index">
					<wd-tab :title="item.title + ' (' + item.count + ')'">
						<wd-gap height="110rpx"></wd-gap>

						<view v-if="activeTab === 0">
							<view v-if="model.allDataList.length > 0">
								<view v-for="(item, index) in model.allDataList" :key="index">
									<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: index === 0 ? '0 20rpx 20rpx 20rpx' : index === model.allDataList.length - 1 ? '20rpx 20rpx 40rpx 20rpx' : '20rpx', borderRadius: '20rpx' }">
										<view style="padding: 5rpx;">
											<wd-cell :title="item.username" custom-class="cellClass" custom-title-class="cellLabelTitle" ellipsis center>
												<wd-tag round :type="item.status === 1 ? 'warning' : item.status === 2 ? 'success' : item.status === 3 ? 'default' : 'default'">
													{{ item.status === 1 ? '外勤' : item.status === 2 ? '公司' : item.status === 3 ? '未知' : '未知' }}
												</wd-tag>
											</wd-cell>
										</view>
									</view>
								</view>
							</view>

							<view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '0 20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
								<wd-status-tip image="../static/search.png" tip="暂无工程中心人员实时考勤统计信息" />
							</view>
						</view>

						<view v-if="activeTab === 1">
							<view v-if="model.fieldworkDataList.length > 0">
								<view v-for="(fieldworkItem, fieldworkIndex) in model.fieldworkDataList" :key="fieldworkIndex">
									<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: fieldworkIndex === 0 ? '0 20rpx 20rpx 20rpx' : '20rpx', borderRadius: '20rpx' }">
										<view style="padding: 5rpx;">
											<wd-cell custom-class="cellClass" custom-title-class="cellLabelTitle" ellipsis center>
												<template #title>
													<view style="display: flex; align-items: center; gap: 10rpx;">
														<wd-img round :width="40" :height="40" :src="fieldworkItem.userimage || 'https://pms.linkqi.cn:18443/soybean.jpg'" :preview-src="fieldworkItem.userimage || 'https://pms.linkqi.cn:18443/soybean.jpg'" :enable-preview="true" />
														<wd-text bold :text="fieldworkItem.username" color="#000000"></wd-text>
													</view>

													<!-- <view v-else>
														<wd-text bold :text="fieldworkItem.username" color="#000000"></wd-text>
													</view> -->
												</template>
												<wd-tag round :type="fieldworkItem.status === 1 ? 'warning' : fieldworkItem.status === 2 ? 'success' : fieldworkItem.status === 3 ? 'default' : 'default'">
													{{ fieldworkItem.status === 1 ? '外勤' : fieldworkItem.status === 2 ? '公司' : fieldworkItem.status === 3 ? '未知' : '未知' }}
												</wd-tag>
											</wd-cell>

											<wd-cell icon="layers" title="项目名称" :value="fieldworkItem.proname" custom-class="cellClass"></wd-cell>
											<wd-cell icon="time" title="打卡时间" :value="fieldworkItem.dbtime" custom-class="cellClass"></wd-cell>
											<wd-cell icon="location" title="打卡地点" :value="fieldworkItem.address" custom-class="cellClass"></wd-cell>
										</view>
									</view>
								</view>
							</view>

							<view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '0 20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
								<wd-status-tip image="../static/search.png" tip="暂无工程中心人员实时考勤统计信息" />
							</view>
						</view>

						<view v-if="activeTab === 2">
							<view v-if="model.companyDataList.length > 0">
								<view v-for="(companyItem, companyIndex) in model.unknownDataList" :key="companyIndex">
									<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: companyIndex === 0 ? '0 20rpx 20rpx 20rpx' : '20rpx', borderRadius: '20rpx' }">
										<view style="padding: 5rpx;">
											<wd-cell :title="companyItem.username" custom-class="cellClass" custom-title-class="cellLabelTitle" ellipsis center>
												<wd-tag round :type="companyItem.status === 1 ? 'warning' : companyItem.status === 2 ? 'success' : companyItem.status === 3 ? 'default' : 'default'">
													{{ companyItem.status === 1 ? '外勤' : companyItem.status === 2 ? '公司' : companyItem.status === 3 ? '未知' : '未知' }}
												</wd-tag>
											</wd-cell>
										</view>
									</view>
								</view>
							</view>

							<view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '0 20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
								<wd-status-tip image="../static/search.png" tip="暂无工程中心人员实时考勤统计信息" />
							</view>
						</view>

						<view v-if="activeTab === 3">
							<view v-if="model.unknownDataList.length > 0">
								<view v-for="(unknownItem, unknownIndex) in model.unknownDataList" :key="unknownIndex">
									<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', width: 'calc(100vw - 40rpx)', margin: unknownIndex === 0 ? '0 20rpx 20rpx 20rpx' : '20rpx', borderRadius: '20rpx' }">
										<view style="padding: 5rpx;">
											<wd-cell :title="unknownItem.username" custom-class="cellClass" custom-title-class="cellLabelTitle" ellipsis center>
												<wd-tag round :type="unknownItem.status === 1 ? 'warning' : unknownItem.status === 2 ? 'success' : unknownItem.status === 3 ? 'default' : 'default'">
													{{ unknownItem.status === 1 ? '外勤' : unknownItem.status === 2 ? '公司' : unknownItem.status === 3 ? '未知' : '未知' }}
												</wd-tag>
											</wd-cell>
										</view>
									</view>
								</view>
							</view>

							<view v-else :style="{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 'calc(100vw - 40rpx)', margin: '0 20rpx', borderRadius: '20rpx', padding: '40rpx 0', background: isDark ? '#1b1b1b' : '#ffffff' }">
								<wd-status-tip image="../static/search.png" tip="暂无工程中心人员实时考勤统计信息" />
							</view>
						</view>
					</wd-tab>
				</block>
			</wd-tabs>
		</view>

		<view style="padding: 20rpx" v-else>
			<view :style="{ borderRadius: '20rpx', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20rpx', background: isDark ? '#1b1b1b' : '#ffffff' }">
				<view :style="{ borderRadius: '20rpx', display: 'flex', alignItems: 'center' }">
					<wd-img :width="50" :height="50" round :src="avatarImage" :preview-src="avatarImage" :enable-preview="true" />
					<view style="display: flex; justify-content: space-around; flex-direction: column; margin-left: 20rpx; line-height: 2">
						<wd-text bold :text="username" size="16px" :color="isDark ? '#ffffff' : '#1b1b1b'" />
						<wd-text text="工程中心人员打卡" size="12px" />
					</view>
				</view>

				<wd-icon v-if="hasPermission('project:Clockin:report:select')" name="calendar" size="26px" @click="handleJumpChange"></wd-icon>
			</view>

			<wd-gap height="20rpx" />

			<!-- 绑定项目 -->
			<view style="display: flex; justify-content: left; align-items: center; justify-content: space-between; flex-wrap: nowrap; padding: 10px 0 10rpx 10px; width: calc(100vw - 60rpx);">
				<view style="display: flex; align-items: center;">
					<view style="width: 5px; height: 15px; background: #0055FE;"></view>
					<view style="margin-left: 10rpx; font-weight: bolder;">项目名称</view>
				</view>
				<view>
					<wd-button icon="link" size="small" @click="handleLinkPrjShowChange">关联项目</wd-button>
				</view>
			</view>
			
			<view v-if="model.checkedPrj && activeAttendanceTab === 1" style="width: 100%; display: flex; justify-content: space-between; align-items: center; gap: 0 20rpx;">
				<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', borderRadius: '20rpx', marginBottom: '20rpx', padding: '5rpx 0 5rpx 20rpx', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }">
					<wd-textarea clearable readonly v-model="model.prjName" placeholder="请选择项目名称(默认远程调试)" no-border auto-height custom-class="textareaWrap"></wd-textarea>
					<wd-button v-if="model.prjName" type="icon" icon="close-circle" custom-class="closeButtonWrap" @click="handleClearPrjChange"></wd-button>
				</view>
			</view>

			<view v-if="model.checkedPrj && activeAttendanceTab === 2" style="width: 100%; display: flex; justify-content: space-between; align-items: center; gap: 0 20rpx;">
				<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', borderRadius: '20rpx', marginBottom: '20rpx', padding: '5rpx 0 5rpx 20rpx', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }">
					<wd-textarea clearable readonly v-model="model.prjName" placeholder="请选择项目名称(默认远程调试)" no-border auto-height custom-class="textareaWrap"></wd-textarea>
					<wd-button v-if="model.prjName" type="icon" icon="close-circle" custom-class="closeButtonWrap" @click="handleClearPrjChange"></wd-button>
				</view>

				<view>
					<wd-button icon="location" size="small" @click="handleLinkPrjaddressShowChange">更多地址</wd-button>
				</view>
			</view>

			<view v-else-if="!model.checkedPrj">
				<view :style="{ background: isDark ? '#1b1b1b' : '#ffffff', borderRadius: '20rpx', marginBottom: '20rpx', padding: '5rpx 20rpx', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }">
					<wd-textarea clearable readonly v-model="model.prjName" placeholder="请选择项目名称(默认远程调试)" no-border auto-height custom-class="textareaWrap"></wd-textarea>
					<wd-button v-if="model.prjName" type="icon" icon="close-circle" custom-class="closeButtonWrap" @click="handleClearPrjChange"></wd-button>
				</view>
			</view>
			
			<view v-if="model.checkedPrj && activeAttendanceTab === 2" style="margin: 0 0 20rpx; border-radius: 20rpx; overflow: hidden; padding: 20rpx; background: #FA4350; color: #ffffff;">
				<view style="margin: 0 0 10rpx; font-size: 28rpx;">* 当前项目地址(若位置错误，请及时联系工程负责人进行修改):</view>
				<wd-text bold :text="currentPrjAddress" size="14px" color="#ffffff" />
			</view>
			
			<view class="headerRadioWrap" :style="{ background: isDark ? '#131313' : '#ffffff' }">
				<view class="wd-radio-custom" :style="activeAttendanceTab === 1 ? { ...checkedStyle, background: isDark ? '#131313' : '#ffffff' } : { ...unCheckedStyle, background: isDark ? '#131313' : 'transparent' }" @click="activeAttendanceTab = 1">
					路程
				</view>

				<view class="wd-radio-custom" :style="activeAttendanceTab === 2 ? { ...checkedStyle, background: isDark ? '#131313' : '#ffffff' } : { ...unCheckedStyle, background: isDark ? '#131313' : 'transparent' }" @click="activeAttendanceTab = 2">
					考勤
				</view>
			</view>
			
			<wd-gap height="20rpx" />

			<view v-if="model.lastClockInInfo.address && activeAttendanceTab === 2 && (model.lastClockInInfo.status === 0 || model.lastClockInInfo.status === 1)" :style="{ borderRadius: '20rpx', background: isDark ? '#1b1b1b' : '#ffffff', overflow: 'hidden' }">
				<wd-cell title="打卡状态" icon="clock" center>
					<wd-tag round :type="model.lastClockInInfo.status === 0 ? 'success' : model.lastClockInInfo.status === 1 ? 'danger' : 'default'">
						{{ model.lastClockInInfo.status === 0 ? '正常' : model.lastClockInInfo.status === 1 ? '异常' : '未知'  }}
					</wd-tag>
				</wd-cell>

				<wd-cell title="时长" icon="list">
					<wd-text bold :text="model.lastClockInInfo.duration + '小时'" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
				</wd-cell>

				<wd-cell title="打卡类型" icon="list">
					<wd-text bold :text="model.lastClockInInfo.ctype === 0 ? '上班打卡 ' : model.lastClockInInfo.ctype === 1 ? '下班打卡' : model.lastClockInInfo.ctype === 2 ? '系统上报' : '未知'" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
				</wd-cell>

				<wd-cell title="地址" icon="location">
					<wd-text bold :text="model.lastClockInInfo.address" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
				</wd-cell>

				<wd-cell title="打卡误差值" icon="flag">
					<wd-text bold :text="model.lastClockInInfo.distanse + '米'" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
				</wd-cell>

				<wd-cell title="时间" icon="time">
					<wd-text bold :text="model.lastClockInInfo.dbtime" size="14px" :color="isDark ? '#ffffff' : '#000000'" />
				</wd-cell>
				
				<wd-cell :title="model.lastClockInInfo.ctype === 0 ? '上班打卡照片 ' : '下班打卡照片'" icon="picture" v-if="model.lastClockInInfo.re1">
				    <wd-img :width="100" :height="100" :src="model.lastClockInInfo.re1" :enable-preview="true"></wd-img>
				</wd-cell>
			</view>

			<wd-gap height="20rpx" v-if="model.lastClockInInfo.address" />
			
			<view v-if="activeAttendanceTab === 1">
				<wd-tabs animated v-model="activeDepartArriveTab">
					<wd-tab title="出发">
						<view v-if="showDepartButton" :style="{ borderRadius: '20rpx', background: isDark ? '#1b1b1b' : '#ffffff', padding: '40rpx 0', marginTop: '60rpx', marginBottom: '40rpx' }">
							<view :style="{ margin: '60rpx auto', background: '#4169E1', borderRadius: '50%', width: '200px', height: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#fff' }" @click="handleDepartOrArriveClockinChange('depart')">
								<!-- <wd-text bold text="签到" size="20px" lineHeight="30px" :color="isDark ? '#ffffff' : '#ffffff'" /> -->
								<wd-text bold :text="currentTime" size="20px" lineHeight="30px" :color="isDark ? '#ffffff' : '#ffffff'" />
							</view>
						</view>
					</wd-tab>
					<wd-tab title="到达">
						<view v-if="showArriveButton" :style="{ borderRadius: '20rpx', background: isDark ? '#1b1b1b' : '#ffffff', padding: '40rpx 0', marginTop: '60rpx', marginBottom: '40rpx' }">
							<view :style="{ margin: '60rpx auto', background: '#4169E1', borderRadius: '50%', width: '200px', height: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#fff' }" @click="handleDepartOrArriveClockinChange('arrive')">
								<!-- <wd-text bold text="签到" size="20px" lineHeight="30px" :color="isDark ? '#ffffff' : '#ffffff'" /> -->
								<wd-text bold :text="currentTime" size="20px" lineHeight="30px" :color="isDark ? '#ffffff' : '#ffffff'" />
							</view>
						</view>
					</wd-tab>
				</wd-tabs>
			</view>

			<view v-if="activeAttendanceTab === 2">
				<view v-if="showClockInButton" :style="{ borderRadius: '20rpx', background: isDark ? '#1b1b1b' : '#ffffff', padding: '40rpx 0', marginBottom: '40rpx' }">
				<!-- <view v-if="model.checkedPrj && showClockInButton" :style="{ borderRadius: '20rpx', background: isDark ? '#1b1b1b' : '#ffffff', padding: '20px 0', marginBottom: '40rpx' }"> -->
					<!-- <view :style="{ margin: '60rpx auto', background: '#4169E1', borderRadius: '50%', width: '200px', height: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#fff' }" @click="handleAttendanceClockinChange"> -->
					<view :style="{ margin: '60rpx auto', background: '#4169E1', borderRadius: '50%', width: '200px', height: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#fff' }" @click="handleAttendanceClockinChange">
						<wd-text bold v-if="model.checkedPrj" text="外勤" size="18px" lineHeight="30px" :color="isDark ? '#ffffff' : '#ffffff'" />
						<wd-text bold :text="(isClockIn ? '下班' : '上班') + '打卡'" size="20px" lineHeight="30px" :color="isDark ? '#ffffff' : '#ffffff'" />
						<wd-text bold :text="currentTime" size="18px" lineHeight="30px" :color="isDark ? '#ffffff' : '#ffffff'" />
					</view>
				</view>
			</view>

			<!-- <view v-if="!model.checkedPrj" :style="{ borderRadius: '20rpx', background: isDark ? '#1b1b1b' : '#ffffff', padding: '20px 0', marginBottom: '40rpx' }">
				<view  :style="{ margin: '60rpx auto', background: '#cccccc', borderRadius: '50%', width: '200px', height: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#fff' }">
					<wd-text bold v-if="model.checkedPrj" text="外勤" size="18px" lineHeight="30px" :color="isDark ? '#ffffff' : '#ffffff'" />
					<wd-text bold :text="(isClockIn ? '下班' : '上班') + '打卡'" size="20px" lineHeight="30px" :color="isDark ? '#ffffff' : '#ffffff'" />
					<wd-text bold :text="currentTime" size="18px" lineHeight="30px" :color="isDark ? '#ffffff' : '#ffffff'" />
				</view>
			</view> -->

			<!-- #ifdef H5 -->
			<wd-popup closable custom-style="width: 80vw;" :z-index="999" v-model="prjShow" position="left" @close="handleCloseChange">
				<wd-gap height="70rpx" />

				<wd-search v-model="model.fuzzy" placeholder="请输入项目名称" placeholder-left cancel-txt="搜索" @search="handleSearchFuzzyChange" @cancel="handleSearchFuzzyChange" @clear="handleClearFuzzyChange" />

				<scroll-view scroll-y refresher-enabled :refresher-triggered="triggered" @refresherrefresh="handleScrollRefreshChange" @scrolltolower="handleScrolltolowerChange" style="height: calc(100vh - 170rpx);">
					<wd-radio-group v-model="model.checkedPrj" shape="dot" @change="handleRadioSelectChange">
						<wd-cell v-for="(item, index) in model.prjDataList" :key="index" custom-class="radioCellWrap">
							<wd-radio :value="item.id">{{ item.proname }}</wd-radio>
						</wd-cell>
					</wd-radio-group>
				</scroll-view>
			</wd-popup>
			<!-- #endif -->

			<!-- #ifdef APP || APP-PLUS || MP-WEIXIN -->
			<wd-popup custom-style="width: 80vw; padding-top: 86rpx" :z-index="999" v-model="prjShow" position="left" @close="handleCloseChange">
				<wd-gap height="70rpx" />

				<wd-search v-model="model.fuzzy" placeholder="请输入项目名称" placeholder-left cancel-txt="搜索" @search="handleSearchFuzzyChange" @cancel="handleSearchFuzzyChange" @clear="handleClearFuzzyChange" />

				<scroll-view scroll-y refresher-enabled :refresher-triggered="triggered" @refresherrefresh="handleScrollRefreshChange" @scrolltolower="handleScrolltolowerChange" style="height: calc(100vh - 240rpx);">
					<wd-radio-group v-model="model.checkedPrj" shape="dot" @change="handleRadioSelectChange">
						<wd-cell v-for="(item, index) in model.prjDataList" :key="index" custom-class="radioCellWrap">
							<wd-radio :value="item.id">{{ item.proname }}</wd-radio>
						</wd-cell>
					</wd-radio-group>
				</scroll-view>
			</wd-popup>
			<!-- #endif -->

			<!-- #ifdef H5 -->
			<wd-popup closable custom-style="width: 80vw;" :z-index="999" v-model="prjaddressShow" position="left" @close="handlePrjaddressCloseChange">
				<wd-gap height="70rpx" />

				<wd-search v-model="model.prjaddressFuzzy" placeholder="请输入项目地址名称" placeholder-left cancel-txt="搜索" @search="handleSearchPrjaddressFuzzyChange" @cancel="handleSearchPrjaddressFuzzyChange" @clear="handleClearPrjaddressFuzzyChange" />

				<scroll-view scroll-y refresher-enabled :refresher-triggered="prjaddressTriggered" @refresherrefresh="handleScrollPrjaddressRefreshChange" @scrolltolower="handleScrollPrjaddresstolowerChange" style="height: calc(100vh - 170rpx);">
					<wd-radio-group v-model="model.checkedPrjaddress" shape="dot" @change="handleRadioPrjaddressSelectChange">
						<wd-cell v-for="(item, index) in model.prjaddressDataList" :key="index" custom-class="radioCellWrap">
							<wd-radio :value="item.id">{{ item.addr }}</wd-radio>
						</wd-cell>
					</wd-radio-group>
				</scroll-view>
			</wd-popup>
			<!-- #endif -->

			<!-- #ifdef APP || APP-PLUS || MP-WEIXIN -->
			<wd-popup custom-style="width: 80vw; padding-top: 86rpx" :z-index="999" v-model="prjaddressShow" position="left" @close="handlePrjaddressCloseChange">
				<wd-gap height="70rpx" />

				<wd-search v-model="model.prjaddressFuzzy" placeholder="请输入项目地址名称" placeholder-left cancel-txt="搜索" @search="handleSearchPrjaddressFuzzyChange" @cancel="handleSearchPrjaddressFuzzyChange" @clear="handleClearPrjaddressFuzzyChange" />

				<scroll-view scroll-y refresher-enabled :refresher-triggered="prjaddressTriggered" @refresherrefresh="handleScrollPrjaddressRefreshChange" @scrolltolower="handleScrollPrjaddresstolowerChange" style="height: calc(100vh - 240rpx);">
					<wd-radio-group v-model="model.checkedPrjaddress" shape="dot" @change="handleRadioPrjaddressSelectChange">
						<wd-cell v-for="(item, index) in model.prjaddressDataList" :key="index" custom-class="radioCellWrap">
							<wd-radio :value="item.id">{{ item.addr }}</wd-radio>
						</wd-cell>
					</wd-radio-group>
				</scroll-view>
			</wd-popup>
			<!-- #endif -->
		</view>
		
		<canvas canvas-id="blurDetectCanvas" id="blurDetectCanvas" class="hidden-canvas"></canvas>
		
		<wd-tabbar shape="round" model-value="attendance" placeholder bordered safe-area-inset-bottom fixed @change="handleTabbarChange">
			<wd-tabbar-item v-for="(item, index) in tabbarList" :key="index" :name="item.name" :value="getTabbarItemValue(item.name)" :title="item.title" :icon="item.icon" />
		</wd-tabbar>
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

:deep(.cellValueClass) {
    font-size: 16px !important;
    font-weight: bolder !important;
}

:deep(.cellLabelTitle) {
    font-weight: bolder !important;
}

:deep(.cellClass) {
    padding: 0 !important;

    .wd-cell__wrapper {
        padding: 10rpx !important;
    }

    .wd-cell__right {
        font-weight: bold !important;
    }
}

.statusText {
    margin-top: 10rpx;
}

:deep(.wd-cell-group__body) {
    overflow: hidden !important;
    border-radius: 40rpx !important;
}

.radioCellWrap {
    padding: 0 !important;

    :deep(.wd-cell__wrapper) {
        display: block !important;
        padding: 20rpx !important;
    }
}

.textareaWrap {
    width: calc(100% - 100rpx) !important;
}

:deep(.wd-radio__label) {
    text-align: left !important;
    width: calc(100% - 80rpx) !important;
}

.headerRadioWrap {
	display: flex;
	width: 100%;
	border-radius: 20rpx;
	padding: 4px;
	box-sizing: border-box;
	overflow: hidden;
}

.hidden-canvas {
	// width: 120px;
	// height: 120px;
	width: 400px;
	height: 400px;
	position: fixed;
	left: -9999px;
}
</style>
